import type { LaunchEconomicsInput } from './launch-economics'

export interface LaunchWorkspaceInput {
  title: string
  audience: string
  benefit: string
  supplierUrl: string
  supplierProductId?: string
  evidence: { supplierVerified: boolean; shippingVerified: boolean; demandVerified: boolean; checkedAt: string }
  economics: LaunchEconomicsInput
  experiment: { spend: number; orders: number; revenue: number; refunds: number }
}
export interface LaunchWorkspace {
  id: string
  title: string
  payload: LaunchWorkspaceInput
  createdAt: string
  updatedAt: string
}
export class LaunchValidationError extends Error {}
function object(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new LaunchValidationError(`${name} must be an object`)
  return value as Record<string, unknown>
}
function string(value: unknown, name: string, max: number, optional = false): string {
  if (typeof value !== 'string' || value.length > max || (!optional && !value.trim())) throw new LaunchValidationError(`${name} must be ${optional ? 'at most' : 'between 1 and'} ${max} characters`)
  return value.trim()
}
function number(value: unknown, name: string, max = 1_000_000_000): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) throw new LaunchValidationError(`${name} must be a nonnegative finite number at most ${max}`)
  return value
}
export function validateLaunchWorkspace(value: unknown): LaunchWorkspaceInput {
  const input = object(value, 'Launch')
  const title = string(input.title, 'Title', 160)
  const audience = string(input.audience, 'Audience', 500)
  const benefit = string(input.benefit, 'Benefit', 1000)
  const supplierUrl = string(input.supplierUrl, 'Supplier URL', 2048, true)
  if (supplierUrl) {
    let url: URL
    try { url = new URL(supplierUrl) } catch { throw new LaunchValidationError('Supplier URL must be an HTTP or HTTPS URL') }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new LaunchValidationError('Supplier URL must be an HTTP or HTTPS URL without credentials')
  }
  let supplierProductId: string | undefined
  if (input.supplierProductId !== undefined && input.supplierProductId !== '') {
    supplierProductId = string(input.supplierProductId, 'Supplier product ID', 36)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supplierProductId)) throw new LaunchValidationError('Supplier product ID must be a UUID')
  }
  const rawEvidence = object(input.evidence, 'Evidence')
  for (const key of ['supplierVerified', 'shippingVerified', 'demandVerified']) {
    if (typeof rawEvidence[key] !== 'boolean') throw new LaunchValidationError(`${key} must be true or false`)
  }
  const checkedAt = string(rawEvidence.checkedAt, 'Checked date', 40, true)
  if (checkedAt && (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(checkedAt) || !Number.isFinite(Date.parse(checkedAt)) || new Date(checkedAt).toISOString().slice(0, 10) !== checkedAt.slice(0, 10) || Date.parse(checkedAt) > Date.now())) throw new LaunchValidationError('Checked date must be a valid date no later than today')
  if ((rawEvidence.supplierVerified || rawEvidence.shippingVerified || rawEvidence.demandVerified) && !checkedAt) throw new LaunchValidationError('Verified evidence requires a checked date')
  if (rawEvidence.supplierVerified && !supplierUrl) throw new LaunchValidationError('Supplier verification requires a supplier URL')
  const rawEconomics = object(input.economics, 'Economics')
  const keys = ['sellPrice', 'unitCost', 'shippingCost', 'paymentFeePercent', 'paymentFeeFlat', 'platformFeePercent', 'returnsReservePercent', 'adCostPerOrder', 'testBudget', 'targetProfitPerOrder'] as const
  const economics = {} as LaunchEconomicsInput
  for (const key of keys) economics[key] = number(rawEconomics[key], key, key.endsWith('Percent') ? 100 : 1_000_000_000)
  if (economics.sellPrice <= 0) throw new LaunchValidationError('Sell price must be greater than zero')
  const rawExperiment = object(input.experiment, 'Experiment')
  const experiment = {
    spend: number(rawExperiment.spend, 'Spend'), orders: number(rawExperiment.orders, 'Orders', 1_000_000),
    revenue: number(rawExperiment.revenue, 'Revenue'), refunds: number(rawExperiment.refunds, 'Refunds'),
  }
  if (!Number.isInteger(experiment.orders)) throw new LaunchValidationError('Orders must be an integer')
  if (experiment.refunds > experiment.revenue) throw new LaunchValidationError('Refunds cannot exceed recorded revenue')
  return { title, audience, benefit, supplierUrl, ...(supplierProductId ? { supplierProductId } : {}), economics, experiment, evidence: { supplierVerified: rawEvidence.supplierVerified as boolean, shippingVerified: rawEvidence.shippingVerified as boolean, demandVerified: rawEvidence.demandVerified as boolean, checkedAt } }
}
export const parseLaunchWorkspace = validateLaunchWorkspace

export function generateCampaignDrafts(input: LaunchWorkspaceInput) {
  return {
    listingTitle: input.title,
    listingDescription: `${input.title}\n\nFor ${input.audience}.\n\nMerchant-provided benefit: ${input.benefit}\n\nBefore publishing: substantiate this benefit and add verified specifications, delivery estimates, return terms, and original or licensed photos.`,
    hooks: [`${input.audience}: looking for ${input.benefit}?`, `A closer look at ${input.title}.`, `Could ${input.title} fit your needs? Here's what to check.`],
    videoScript: `[Template draft — verify all claims before recording]\n0–3s: Show ${input.title} with the question: “Looking for ${input.benefit}?”\n3–12s: Demonstrate the product using your own footage. Explain only features you have verified.\n12–20s: Explain who it is for: ${input.audience}. Show limitations and verified delivery terms.\n20–25s: Invite viewers to review the product details and decide whether it fits their needs.`,
    checklist: ['These are deterministic templates, not AI-generated research or verified product claims.', 'Verification checkboxes are your manual attestations, not independent verification. Confirm supplier identity, stock, landed costs, destination-specific shipping, and return terms.', 'Substantiate your stated benefit; remove unsupported medical, safety, income, and performance claims.', 'Use original or licensed media and disclose required sponsorships.', 'Review the listing and approve publishing yourself.', 'Set a test spending cap and record actual spend, orders, revenue, and refunds.'],
  }
}
export const buildLaunchCampaign = generateCampaignDrafts

export function evaluateLaunchExperiment(input: LaunchWorkspaceInput) {
  const { spend, orders, revenue, refunds } = input.experiment
  const costs = input.economics
  const productAndShippingCost = orders * (costs.unitCost + costs.shippingCost)
  const paymentFees = revenue * costs.paymentFeePercent / 100 + orders * costs.paymentFeeFlat
  const platformFees = revenue * costs.platformFeePercent / 100
  // Actual refunds replace the planning reserve; do not subtract both.
  const netContribution = revenue - refunds - productAndShippingCost - paymentFees - platformFees - spend
  return { productAndShippingCost, paymentFees, platformFees, netContribution, roas: spend > 0 ? revenue / spend : null, acquisitionCost: orders > 0 ? spend / orders : null, status: orders === 0 ? 'insufficient-data' : netContribution > 0 ? 'positive-contribution' : 'revise-or-stop', note: 'Contribution estimate uses entered costs and actual refunds. It excludes taxes, overhead, unrecorded expenses, and additional return handling; validate against your accounts.' }
}
function csvCell(value: unknown): string {
  let text = String(value ?? '')
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
export function exportLaunchCsv(input: LaunchWorkspaceInput): string {
  const drafts = generateCampaignDrafts(input)
  const rows: unknown[][] = [['field', 'value'], ['title', input.title], ['audience', input.audience], ['benefit', input.benefit], ['supplier_url', input.supplierUrl], ['evidence_checked_at', input.evidence.checkedAt], ['supplier_verified', input.evidence.supplierVerified], ['shipping_verified', input.evidence.shippingVerified], ['demand_verified', input.evidence.demandVerified], ['listing_description_template', drafts.listingDescription], ...drafts.hooks.map((hook, i) => [`hook_${i + 1}`, hook]), ['video_script_template', drafts.videoScript], ...Object.entries(input.economics), ...Object.entries(input.experiment).map(([key, value]) => [`actual_${key}`, value])]
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n')
}
export const launchWorkspaceCsv = exportLaunchCsv
