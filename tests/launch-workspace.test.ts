import { describe, expect, it } from 'vitest'
import { validateLaunchWorkspace, generateCampaignDrafts, exportLaunchCsv, evaluateLaunchExperiment, type LaunchWorkspaceInput } from '../lib/launch-workspace'

const valid = (): LaunchWorkspaceInput => ({
  title: 'Travel organizer', audience: 'frequent travelers', benefit: 'organize small belongings', supplierUrl: 'https://example.com/product',
  evidence: { supplierVerified: false, shippingVerified: false, demandVerified: false, checkedAt: '' },
  economics: { sellPrice: 40, unitCost: 10, shippingCost: 4, paymentFeePercent: 3, paymentFeeFlat: 0.3, platformFeePercent: 1, returnsReservePercent: 5, adCostPerOrder: 8, testBudget: 100, targetProfitPerOrder: 5 },
  experiment: { spend: 20, orders: 2, revenue: 80, refunds: 10 },
})
describe('launch workspace validation', () => {
  it('accepts manually entered unverified product facts', () => expect(validateLaunchWorkspace(valid())).toEqual(valid()))
  it.each([null, [], 'text', 3])('rejects malformed top-level data %s', value => expect(() => validateLaunchWorkspace(value)).toThrow())
  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'https://name:password@example.com', 'not a url'])('rejects unsafe supplier URL %s', supplierUrl => expect(() => validateLaunchWorkspace({ ...valid(), supplierUrl })).toThrow())
  it('requires evidence dates and supplier links when verified', () => {
    const input = valid(); input.evidence.supplierVerified = true
    expect(() => validateLaunchWorkspace(input)).toThrow('checked date')
    input.evidence.checkedAt = '2026-01-02'; input.supplierUrl = ''
    expect(() => validateLaunchWorkspace(input)).toThrow('supplier URL')
  })
  it.each(['2026-02-30', '2026-13-01', 'not a date', '2099-01-01'])('rejects invalid or future checked date %s', checkedAt => expect(() => validateLaunchWorkspace({ ...valid(), evidence: { ...valid().evidence, checkedAt } })).toThrow())
  it('accepts a valid checked date', () => {
    const input = valid(); input.evidence = { supplierVerified: true, shippingVerified: true, demandVerified: false, checkedAt: '2026-01-02' }
    expect(validateLaunchWorkspace(input).evidence.checkedAt).toBe('2026-01-02')
  })
  it.each([NaN, Infinity, -1, '2'])('rejects malformed economics %s', unitCost => expect(() => validateLaunchWorkspace({ ...valid(), economics: { ...valid().economics, unitCost } })).toThrow())
  it('rejects percentages above 100, zero price, fractional orders, and refunds beyond revenue', () => {
    expect(() => validateLaunchWorkspace({ ...valid(), economics: { ...valid().economics, paymentFeePercent: 101 } })).toThrow()
    expect(() => validateLaunchWorkspace({ ...valid(), economics: { ...valid().economics, sellPrice: 0 } })).toThrow()
    expect(() => validateLaunchWorkspace({ ...valid(), experiment: { ...valid().experiment, orders: 1.2 } })).toThrow('integer')
    expect(() => validateLaunchWorkspace({ ...valid(), experiment: { ...valid().experiment, refunds: 100 } })).toThrow('revenue')
  })
  it('bounds text and strips unrecognized fields', () => {
    expect(() => validateLaunchWorkspace({ ...valid(), title: 'a'.repeat(161) })).toThrow()
    expect(validateLaunchWorkspace({ ...valid(), title: ' Product ', userId: 'attacker' })).toEqual({ ...valid(), title: 'Product' })
  })
})
describe('campaign drafts and exports', () => {
  it('labels templates and avoids fabricated product claims', () => {
    const drafts = generateCampaignDrafts(valid())
    expect(drafts.hooks).toHaveLength(3)
    expect(drafts.videoScript).toContain('Template draft')
    expect(drafts.listingDescription).toContain('Merchant-provided benefit')
    expect(drafts.checklist.join(' ')).toContain('deterministic templates')
    expect(JSON.stringify(drafts)).not.toContain('bestseller')
  })
  it('quotes CSV cells and neutralizes formula injection, including whitespace prefixes', () => {
    const input = valid(); input.title = ' =HYPERLINK("https://bad.example")'; input.audience = '\t+cmd'
    const csv = exportLaunchCsv(input)
    expect(csv).toContain('"\' =HYPERLINK(""https://bad.example"")"')
    expect(csv).toContain('"\'\t+cmd"')
    expect(csv).toContain('\r\n')
  })
})
describe('experiment contribution', () => {
  it('uses actual refunds rather than subtracting a reserve twice', () => {
    const result = evaluateLaunchExperiment(valid())
    expect(result.productAndShippingCost).toBe(28)
    expect(result.paymentFees).toBe(3)
    expect(result.platformFees).toBe(0.8)
    expect(result.netContribution).toBeCloseTo(18.2)
    expect(result.roas).toBe(4)
    expect(result.acquisitionCost).toBe(10)
  })
  it('does not claim an untested zero-order campaign is successful', () => {
    const input = valid(); input.experiment = { spend: 0, orders: 0, revenue: 0, refunds: 0 }
    const result = evaluateLaunchExperiment(input)
    expect(result.status).toBe('insufficient-data'); expect(result.roas).toBeNull(); expect(result.acquisitionCost).toBeNull()
  })
  it('flags a losing campaign', () => {
    const input = valid(); input.experiment.spend = 100
    expect(evaluateLaunchExperiment(input).status).toBe('revise-or-stop')
  })
})

import { beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ session: vi.fn(), plan: vi.fn(), list: vi.fn(), create: vi.fn(), get: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getSession: mocks.session }))
vi.mock('@/lib/db', () => ({ getUserPlan: mocks.plan }))
vi.mock('@/lib/launch-db', () => ({
  listLaunches: mocks.list, createLaunch: mocks.create, getLaunch: mocks.get, updateLaunch: mocks.update, deleteLaunch: mocks.remove,
  LaunchLimitError: class LaunchLimitError extends Error { constructor(public limit: number) { super('Plan capacity reached') } },
}))
import { GET as listRoute, POST as createRoute } from '../app/api/launches/route'
import { GET as getRoute, PATCH as patchRoute, DELETE as deleteRoute } from '../app/api/launches/[id]/route'
import { LaunchLimitError } from '../lib/launch-db'
const workspaceId = '11111111-1111-1111-1111-111111111111'
const context = { params: { id: workspaceId } }
const request = (method: string, body?: string) => new NextRequest('https://example.com/api/launches', { method, ...(body !== undefined ? { body, headers: { 'content-type': 'application/json' } } : {}) })
describe('launch API session ownership and safe errors', () => {
  beforeEach(() => {
    vi.resetAllMocks(); mocks.session.mockResolvedValue({ id: 'merchant-id', email: 'merchant@example.com' }); mocks.plan.mockResolvedValue('free')
  })
  it('requires authentication for every operation', async () => {
    mocks.session.mockResolvedValue(null)
    const responses = await Promise.all([listRoute(), createRoute(request('POST', '{}')), getRoute(request('GET'), context), patchRoute(request('PATCH', '{}'), context), deleteRoute(request('DELETE'), context)])
    expect(responses.map(response => response.status)).toEqual([401, 401, 401, 401, 401])
    expect(mocks.list).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled()
  })
  it('returns malformed JSON as a 400 response', async () => {
    expect((await createRoute(request('POST', '{bad'))).status).toBe(400)
    expect((await patchRoute(request('PATCH', '{bad'), context)).status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled()
  })
  it('returns validated creation and passes the session user rather than a submitted user ID', async () => {
    mocks.create.mockResolvedValue({ id: workspaceId, payload: valid() })
    const response = await createRoute(request('POST', JSON.stringify({ ...valid(), userId: 'attacker' })))
    expect(response.status).toBe(201)
    expect(mocks.create).toHaveBeenCalledWith('merchant-id', valid())
  })
  it('enforces workspace capacities through a 402 response', async () => {
    mocks.create.mockRejectedValue(new LaunchLimitError(3))
    const response = await createRoute(request('POST', JSON.stringify(valid())))
    expect(response.status).toBe(402); expect(await response.json()).toMatchObject({ code: 'PLAN_LIMIT' })
  })
  it('scopes reads, edits and deletion to the signed-in user and returns 404 for absent/other-user IDs', async () => {
    mocks.get.mockResolvedValue(null); mocks.update.mockResolvedValue(null); mocks.remove.mockResolvedValue(false)
    expect((await getRoute(request('GET'), context)).status).toBe(404)
    expect((await patchRoute(request('PATCH', JSON.stringify(valid())), context)).status).toBe(404)
    expect((await deleteRoute(request('DELETE'), context)).status).toBe(404)
    expect(mocks.get).toHaveBeenCalledWith('merchant-id', workspaceId)
    expect(mocks.update).toHaveBeenCalledWith('merchant-id', workspaceId, valid())
    expect(mocks.remove).toHaveBeenCalledWith('merchant-id', workspaceId)
  })
  it('rejects malformed identifiers before querying storage', async () => {
    const malformed = { params: { id: 'not-uuid' } }
    expect((await getRoute(request('GET'), malformed)).status).toBe(400)
    expect((await patchRoute(request('PATCH', '{}'), malformed)).status).toBe(400)
    expect((await deleteRoute(request('DELETE'), malformed)).status).toBe(400)
    expect(mocks.get).not.toHaveBeenCalled()
  })
  it('does not expose internal database errors', async () => {
    const secret = 'postgres://private:secret@db.internal SQL leak'
    mocks.list.mockRejectedValue(new Error(secret)); mocks.create.mockRejectedValue(new Error(secret)); mocks.get.mockRejectedValue(new Error(secret)); mocks.update.mockRejectedValue(new Error(secret)); mocks.remove.mockRejectedValue(new Error(secret))
    const responses = await Promise.all([listRoute(), createRoute(request('POST', JSON.stringify(valid()))), getRoute(request('GET'), context), patchRoute(request('PATCH', JSON.stringify(valid())), context), deleteRoute(request('DELETE'), context)])
    for (const response of responses) { expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain(secret) }
  })
  it('reports plan capacity alongside saved workspaces', async () => {
    mocks.list.mockResolvedValue([]); mocks.plan.mockResolvedValue('pro')
    const response = await listRoute()
    expect(await response.json()).toEqual({ launches: [], plan: 'pro', limit: 50 })
  })
})
it('accepts only UUID supplier product references', () => {
  expect(validateLaunchWorkspace({ ...valid(), supplierProductId: workspaceId }).supplierProductId).toBe(workspaceId)
  expect(() => validateLaunchWorkspace({ ...valid(), supplierProductId: 'malicious' })).toThrow('UUID')
})
