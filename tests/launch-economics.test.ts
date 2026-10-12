import { describe, expect, it } from 'vitest'
import { calculateLaunchEconomics, type LaunchEconomicsInput } from '../lib/launch-economics'

const scenario: LaunchEconomicsInput = {
  sellPrice: 50, unitCost: 12, shippingCost: 5,
  paymentFeePercent: 3, paymentFeeFlat: 0.3, platformFeePercent: 2,
  returnsReservePercent: 5, adCostPerOrder: 10, testBudget: 105,
  targetProfitPerOrder: 10,
}

describe('launch economics', () => {
  it('includes shipping, payment, platform, returns and ads in the profit decision', () => {
    const result = calculateLaunchEconomics(scenario)
    expect(result.contributionBeforeAds).toBeCloseTo(27.7)
    expect(result.netProfitPerOrder).toBeCloseTo(17.7)
    expect(result.netMarginPercent).toBeCloseTo(35.4)
    expect(result.breakEvenCAC).toBeCloseTo(27.7)
    expect(result.breakEvenROAS).toBeCloseTo(50 / 27.7)
    expect(result.maxCACForTargetProfit).toBeCloseTo(17.7)
    expect(result.affordableTestOrders).toBe(10)
    expect(result.recommendation).toBe('test')
  })

  it('an apparently profitable product becomes a stop after shipping and returns', () => {
    const result = calculateLaunchEconomics({ ...scenario, unitCost: 30, shippingCost: 12, returnsReservePercent: 15 })
    expect(result.contributionBeforeAds).toBeCloseTo(-2.3)
    expect(result.netProfitPerOrder).toBeCloseTo(-12.3)
    expect(result.recommendation).toBe('stop')
    expect(result.breakEvenCAC).toBe(0)
    expect(result.breakEvenROAS).toBeNull()
    expect(result.maxCACForTargetProfit).toBe(0)
  })

  it('stops spending when ads exhaust positive contribution', () => {
    expect(calculateLaunchEconomics({ ...scenario, adCostPerOrder: 28 }).recommendation).toBe('stop')
    const exactBreakEven = { ...scenario, sellPrice: 20, unitCost: 10, shippingCost: 0,
      paymentFeePercent: 0, paymentFeeFlat: 0, platformFeePercent: 0, returnsReservePercent: 0, adCostPerOrder: 10 }
    expect(calculateLaunchEconomics(exactBreakEven).recommendation).toBe('stop')
  })

  it('handles zero contribution without dividing by zero', () => {
    const result = calculateLaunchEconomics({ ...scenario, sellPrice: 10, unitCost: 10,
      shippingCost: 0, paymentFeePercent: 0, paymentFeeFlat: 0, platformFeePercent: 0,
      returnsReservePercent: 0, adCostPerOrder: 0 })
    expect(result.netProfitPerOrder).toBe(0)
    expect(result.breakEvenROAS).toBeNull()
    expect(result.affordableTestOrders).toBeNull()
    expect(result.recommendation).toBe('stop')
  })

  it('keeps unverified supplier or demand assumptions in review', () => {
    const result = calculateLaunchEconomics(scenario, [' Supplier shipping quote ', 'Demand evidence', 'Demand evidence', ''])
    expect(result.recommendation).toBe('review')
    expect(result.missingEvidence).toEqual(['Supplier shipping quote', 'Demand evidence'])
  })

  it('reviews thin margins, unattainable targets and an inadequate ad budget', () => {
    expect(calculateLaunchEconomics({ ...scenario, adCostPerOrder: 22 }).recommendation).toBe('review')
    const target = calculateLaunchEconomics({ ...scenario, targetProfitPerOrder: 30 })
    expect(target.recommendation).toBe('review')
    expect(target.maxCACForTargetProfit).toBe(0)
    const budget = calculateLaunchEconomics({ ...scenario, testBudget: 9 })
    expect(budget.recommendation).toBe('review')
    expect(budget.affordableTestOrders).toBe(0)
  })

  it('does not invent unlimited paid orders for a zero-CAC scenario', () => {
    expect(calculateLaunchEconomics({ ...scenario, adCostPerOrder: 0 }).affordableTestOrders).toBeNull()
  })

  for (const field of Object.keys(scenario) as (keyof LaunchEconomicsInput)[]) {
    it.each([-1, NaN, Infinity, -Infinity])(`rejects invalid ${field}: %s`, value => {
      expect(() => calculateLaunchEconomics({ ...scenario, [field]: value })).toThrow(RangeError)
    })
  }

  it('rejects zero price, missing amounts and percentages over 100', () => {
    expect(() => calculateLaunchEconomics({ ...scenario, sellPrice: 0 })).toThrow(RangeError)
    expect(() => calculateLaunchEconomics({ ...scenario, unitCost: undefined } as unknown as LaunchEconomicsInput)).toThrow(RangeError)
    for (const field of ['paymentFeePercent', 'platformFeePercent', 'returnsReservePercent']) {
      expect(() => calculateLaunchEconomics({ ...scenario, [field]: 100.01 })).toThrow(RangeError)
    }
  })

  it('rejects finite inputs whose calculations overflow', () => {
    expect(() => calculateLaunchEconomics({ ...scenario, sellPrice: Number.MAX_VALUE,
      paymentFeePercent: 100, platformFeePercent: 100 })).toThrow(RangeError)
  })

  it('does not mutate the scenario or evidence', () => {
    const input = Object.freeze({ ...scenario })
    const evidence = Object.freeze(['Shipping quote'])
    calculateLaunchEconomics(input, evidence)
    expect(input).toEqual(scenario)
    expect(evidence).toEqual(['Shipping quote'])
  })
})
