/** All money amounts must use the same currency; percentages are 0–100. */
export interface LaunchEconomicsInput {
  sellPrice: number
  unitCost: number
  shippingCost: number
  paymentFeePercent: number
  paymentFeeFlat: number
  platformFeePercent: number
  returnsReservePercent: number
  adCostPerOrder: number
  /** Advertising test budget, separate from inventory and fulfillment funding. */
  testBudget: number
  targetProfitPerOrder: number
}

export interface LaunchEconomicsResult {
  contributionBeforeAds: number
  netProfitPerOrder: number
  netMarginPercent: number
  breakEvenCAC: number
  breakEvenROAS: number | null
  maxCACForTargetProfit: number
  /** Paid-ad orders at the supplied CAC; null if CAC is zero. */
  affordableTestOrders: number | null
  recommendation: 'stop' | 'review' | 'test'
  reasons: string[]
  missingEvidence: string[]
}

const fields: readonly (keyof LaunchEconomicsInput)[] = [
  'sellPrice', 'unitCost', 'shippingCost', 'paymentFeePercent',
  'paymentFeeFlat', 'platformFeePercent', 'returnsReservePercent',
  'adCostPerOrder', 'testBudget', 'targetProfitPerOrder',
]

const percentageFields: readonly (keyof LaunchEconomicsInput)[] = [
  'paymentFeePercent', 'platformFeePercent', 'returnsReservePercent',
]

/**
 * Scenario math, not a demand forecast. Fees and the returns reserve are based
 * on gross selling price. Shipping is the merchant's fulfillment cost. Taxes,
 * fixed overhead and any fees not entered here are excluded. Supply missing
 * evidence explicitly: favorable assumptions alone do not validate a launch.
 * Calculations retain precision; round only when displaying currency.
 */
export function calculateLaunchEconomics(
  input: LaunchEconomicsInput,
  missingEvidence: readonly string[] = [],
): LaunchEconomicsResult {
  for (const field of fields) {
    if (typeof input[field] !== 'number' || !Number.isFinite(input[field]) || input[field] < 0) {
      throw new RangeError(`${field} must be a finite, nonnegative number`)
    }
  }
  if (input.sellPrice === 0) throw new RangeError('sellPrice must be greater than zero')
  for (const field of percentageFields) {
    if (input[field] > 100) throw new RangeError(`${field} must be between 0 and 100`)
  }

  const percentageCosts = input.sellPrice * (
    input.paymentFeePercent + input.platformFeePercent + input.returnsReservePercent
  ) / 100
  const contributionBeforeAds = input.sellPrice - input.unitCost - input.shippingCost
    - input.paymentFeeFlat - percentageCosts
  const netProfitPerOrder = contributionBeforeAds - input.adCostPerOrder
  const netMarginPercent = netProfitPerOrder / input.sellPrice * 100
  const breakEvenCAC = Math.max(0, contributionBeforeAds)
  const breakEvenROAS = contributionBeforeAds > 0 ? input.sellPrice / contributionBeforeAds : null
  const maxCACForTargetProfit = Math.max(0, contributionBeforeAds - input.targetProfitPerOrder)
  const affordableTestOrders = input.adCostPerOrder > 0
    ? Math.floor(input.testBudget / input.adCostPerOrder) : null

  const computed = [contributionBeforeAds, netProfitPerOrder, netMarginPercent,
    breakEvenCAC, maxCACForTargetProfit, breakEvenROAS, affordableTestOrders]
  if (computed.some(value => value !== null && !Number.isFinite(value))) {
    throw new RangeError('Inputs exceed the supported calculation range')
  }

  const evidence = Array.from(new Set(missingEvidence.map(item => item.trim()).filter(Boolean)))
  const reasons: string[] = []
  let recommendation: LaunchEconomicsResult['recommendation']
  if (contributionBeforeAds <= 0 || netProfitPerOrder <= 0) {
    recommendation = 'stop'
    reasons.push(contributionBeforeAds <= 0
      ? 'Fulfillment, fees and returns consume the selling price before advertising.'
      : 'Advertising consumes the remaining contribution; each order loses money or breaks even.')
  } else {
    if (netProfitPerOrder < input.targetProfitPerOrder) reasons.push('Profit per order is below your target.')
    if (netMarginPercent < 15) reasons.push('Net margin is below the 15% review threshold; the scenario has little room for cost changes.')
    if (affordableTestOrders === 0) reasons.push('The advertising budget cannot fund one order at the assumed acquisition cost.')
    if (evidence.length) reasons.push('Verify the missing evidence before spending on a launch.')
    recommendation = reasons.length ? 'review' : 'test'
    if (recommendation === 'test') reasons.push('The entered scenario supports a controlled test; actual demand and costs still determine the outcome.')
  }

  return { contributionBeforeAds, netProfitPerOrder, netMarginPercent, breakEvenCAC,
    breakEvenROAS, maxCACForTargetProfit, affordableTestOrders, recommendation,
    reasons, missingEvidence: evidence }
}
