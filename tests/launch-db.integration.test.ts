/**
 * Optional integration suite. Only enable with a disposable test Postgres:
 * DATABASE_URL=<test database> RUN_LAUNCH_DB_TESTS=1 npm test -- tests/launch-db.integration.test.ts
 * Never point this suite at a production database. It initializes schemas and
 * removes only its uniquely tagged fixture users (their workspaces cascade).
 * DATABASE_URL alone does not enable the suite.
 */
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensureSchema, sql } from '../lib/database'
import { createLaunch, deleteLaunch, ensureLaunchSchema, getLaunch, LaunchLimitError, listLaunches, updateLaunch } from '../lib/launch-db'
import type { LaunchWorkspaceInput } from '../lib/launch-workspace'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.RUN_LAUNCH_DB_TESTS === '1' && process.env.NODE_ENV !== 'production'
const fixtureIds: string[] = []
const runId = randomUUID()
function payload(title = 'Test organizer'): LaunchWorkspaceInput {
  return {
    title, audience: 'test shoppers', benefit: 'test organization', supplierUrl: 'https://example.com/test',
    evidence: { supplierVerified: false, shippingVerified: false, demandVerified: false, checkedAt: '' },
    economics: { sellPrice: 40, unitCost: 10, shippingCost: 5, paymentFeePercent: 3, paymentFeeFlat: 0.3, platformFeePercent: 1, returnsReservePercent: 5, adCostPerOrder: 8, testBudget: 100, targetProfitPerOrder: 5 },
    experiment: { spend: 0, orders: 0, revenue: 0, refunds: 0 },
  }
}
async function fixtureUser(plan: 'free' | 'pro' = 'free'): Promise<string> {
  const id = randomUUID()
  await sql`insert into users(id,email,password_hash,plan) values(${id},${`launch-test-${runId}-${id}@example.invalid`},'integration-fixture-no-login',${plan})`
  fixtureIds.push(id)
  return id
}

describe.skipIf(!enabled)('launch workspace test database isolation and capacity', () => {
  beforeAll(async () => {
    await ensureSchema()
    await ensureLaunchSchema()
  }, 60_000)
  afterAll(async () => {
    if (fixtureIds.length) await sql`delete from users where id = any(${fixtureIds}::uuid[]) and email like ${`launch-test-${runId}-%@example.invalid`}`
  }, 30_000)

  it('persists full payload and prevents another user reading, changing, or deleting it', async () => {
    const owner = await fixtureUser()
    const stranger = await fixtureUser()
    const input = { ...payload(), supplierProductId: randomUUID() }
    const launch = await createLaunch(owner, input)
    expect(launch.payload).toEqual(input)
    expect(launch.title).toBe(input.title)
    expect(Number.isFinite(Date.parse(launch.createdAt))).toBe(true)
    expect((await listLaunches(owner)).map(item => item.id)).toEqual([launch.id])
    expect(await listLaunches(stranger)).toEqual([])
    expect(await getLaunch(stranger, launch.id)).toBeNull()
    expect(await updateLaunch(stranger, launch.id, payload('Unauthorized change'))).toBeNull()
    expect(await deleteLaunch(stranger, launch.id)).toBe(false)
    expect((await getLaunch(owner, launch.id))?.payload).toEqual(input)
    const changed = await updateLaunch(owner, launch.id, payload('Owner revision'))
    expect(changed?.payload.title).toBe('Owner revision')
    expect(changed?.title).toBe('Owner revision')
    expect(await deleteLaunch(owner, launch.id)).toBe(true)
    expect(await getLaunch(owner, launch.id)).toBeNull()
  }, 30_000)

  it('serializes concurrent free-plan creates at three and releases capacity on deletion', async () => {
    const owner = await fixtureUser()
    const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => createLaunch(owner, payload(`Concurrent ${i}`))))
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(3)
    const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    expect(failures).toHaveLength(7)
    for (const result of failures) expect(result.reason).toBeInstanceOf(LaunchLimitError)
    const saved = await listLaunches(owner)
    expect(saved).toHaveLength(3)
    expect(await deleteLaunch(owner, saved[0].id)).toBe(true)
    await expect(createLaunch(owner, payload('Replacement'))).resolves.toMatchObject({ title: 'Replacement' })
    expect(await listLaunches(owner)).toHaveLength(3)
  }, 30_000)

  it('enforces the current pro cap at 50 under concurrency and honors a downgrade', async () => {
    const owner = await fixtureUser('pro')
    // Seed 49 rows efficiently; race four application creates for the last slot.
    const input = payload('Seeded pro workspace')
    await sql`insert into launch_workspaces(user_id,title,payload) select ${owner}::uuid,${input.title},${sql.json(input as never)} from generate_series(1,49)`
    const results = await Promise.allSettled(Array.from({ length: 4 }, (_, i) => createLaunch(owner, payload(`Pro race ${i}`))))
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(3)
    for (const result of results) if (result.status === 'rejected') expect(result.reason).toBeInstanceOf(LaunchLimitError)
    expect(await listLaunches(owner)).toHaveLength(50)
    await sql`update users set plan='free' where id=${owner}`
    try { await createLaunch(owner, payload('After downgrade')); throw new Error('Expected capacity rejection') } catch (error) {
      expect(error).toBeInstanceOf(LaunchLimitError)
      expect((error as LaunchLimitError).limit).toBe(3)
    }
    expect(await listLaunches(owner)).toHaveLength(50)
  }, 30_000)
})
