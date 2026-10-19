import { describe, expect, it } from 'vitest'
import { GUIDES, guideBySlug, guideStructuredData } from '@/lib/marketing/content'
import { marketingPaths } from '@/lib/marketing/paths'
import {
  PROFIT_CALCULATOR_DESCRIPTION,
  PROFIT_CALCULATOR_FAQS,
  PROFIT_CALCULATOR_PATH,
  PROFIT_CALCULATOR_TITLE,
  emptyProfitFields,
  isProfitQuote,
  isProfitResult,
  parseProfitQuote,
  profitFieldsFromSearch,
  profitQuoteSearch,
  runProfitQuote,
  type ProfitQuoteFields,
} from '@/lib/marketing/profit-calculator'
import { documentTitle } from '@/lib/seo'

const scenario: ProfitQuoteFields = {
  productPrice: '40',
  shippingCharge: '10',
  unitCost: '12',
  shippingCost: '5',
  paymentFeePercent: '3',
  paymentFeeFlat: '0.3',
  platformFeePercent: '2',
  returnsReservePercent: '5',
  adCostPerOrder: '10',
  testBudget: '105',
  targetProfitPerOrder: '10',
}

function quote(fields: ProfitQuoteFields) {
  const parsed = parseProfitQuote(fields)
  if (!isProfitQuote(parsed)) throw new Error(parsed.error)
  const result = runProfitQuote(parsed)
  if (!isProfitResult(result)) throw new Error(result.error)
  return result
}

describe('profit calculator', () => {
  it('reuses launch economics, including shipping charged in the customer total', () => {
    const result = quote(scenario)
    expect(result.customerTotal).toBe(50)
    expect(result.input.sellPrice).toBe(50)
    expect(result.economics.contributionBeforeAds).toBeCloseTo(27.7)
    expect(result.economics.netProfitPerOrder).toBeCloseTo(17.7)
    expect(result.economics.netMarginPercent).toBeCloseTo(35.4)
    expect(result.economics.breakEvenCAC).toBeCloseTo(27.7)
    expect(result.economics.breakEvenROAS).toBeCloseTo(50 / 27.7)
    expect(result.economics.maxCACForTargetProfit).toBeCloseTo(17.7)
    expect(result.economics.affordableTestOrders).toBe(10)
    expect(result.economics.recommendation).toBe('test')
    expect(result.budgetEntered).toBe(true)
  })

  it('does not treat a blank ad budget as a failed test', () => {
    const blank = quote({ ...scenario, testBudget: '' })
    expect(blank.budgetEntered).toBe(false)
    expect(blank.input.testBudget).toBe(10)
    expect(blank.economics.reasons.join(' ')).not.toMatch(/cannot fund one order/)

    const zero = quote({ ...scenario, testBudget: '0' })
    expect(zero.budgetEntered).toBe(true)
    expect(zero.economics.affordableTestOrders).toBe(0)
    expect(zero.economics.recommendation).toBe('review')
    expect(zero.economics.reasons.join(' ')).toMatch(/cannot fund one order/)
  })

  it('stops when ads or fulfillment consume the price', () => {
    expect(quote({ ...scenario, adCostPerOrder: '28' }).economics.recommendation).toBe('stop')
    const loss = quote({ ...scenario, unitCost: '30', shippingCost: '12', returnsReservePercent: '15' })
    expect(loss.economics.contributionBeforeAds).toBeCloseTo(-2.3)
    expect(loss.economics.breakEvenROAS).toBeNull()
    expect(loss.economics.breakEvenCAC).toBe(0)
    expect(loss.economics.recommendation).toBe('stop')
  })

  it('rejects a missing price, a negative cost, and a percent over 100', () => {
    const fees = { paymentFeePercent: 2.9, paymentFeeFlat: 0.3, platformFeePercent: 5 }
    const missing = parseProfitQuote(emptyProfitFields(fees))
    expect(isProfitQuote(missing)).toBe(false)
    if (!isProfitQuote(missing)) expect(missing.error).toMatch(/product price/i)

    const negative = parseProfitQuote({ ...scenario, unitCost: '-1' })
    expect(isProfitQuote(negative)).toBe(false)

    const percent = parseProfitQuote({ ...scenario, platformFeePercent: '101' })
    expect(isProfitQuote(percent)).toBe(false)
    if (!isProfitQuote(percent)) expect(percent.error).toMatch(/100/)
  })

  it('round-trips a shared quote without inventing a budget', () => {
    const fields = profitFieldsFromSearch({
      price: '39.99',
      shipCharge: '0',
      cost: '12',
      shipCost: '6',
      cardPercent: '2.9',
      cardFlat: '0.30',
      platformPercent: '5',
      returns: '0',
      ads: '',
    }, { paymentFeePercent: 2.9, paymentFeeFlat: 0.3, platformFeePercent: 5 })
    expect(fields.adCostPerOrder).toBe('')
    expect(fields.testBudget).toBe('')
    const result = quote(fields)
    expect(result.customerTotal).toBeCloseTo(39.99)
    expect(result.economics.contributionBeforeAds).toBeCloseTo(18.53079)
    expect(result.economics.netProfitPerOrder).toBeCloseTo(18.53079)
    expect(result.economics.breakEvenROAS).toBeCloseTo(39.99 / 18.53079)
    expect(result.budgetEntered).toBe(false)
    expect(profitQuoteSearch(fields).startsWith(`${PROFIT_CALCULATOR_PATH}?`)).toBe(true)
  })
})

describe('profit calculator seo', () => {
  it('keeps the tool title, description, FAQs, and sitemap entry within search limits', () => {
    expect(PROFIT_CALCULATOR_DESCRIPTION.length).toBeLessThanOrEqual(160)
    expect(PROFIT_CALCULATOR_DESCRIPTION.length).toBeGreaterThan(50)
    expect(documentTitle(PROFIT_CALCULATOR_TITLE).length).toBeLessThanOrEqual(60)
    expect(PROFIT_CALCULATOR_FAQS.length).toBeGreaterThanOrEqual(3)
    const paths = marketingPaths().map(entry => entry.path)
    expect(paths).toContain(PROFIT_CALCULATOR_PATH)
    const blob = JSON.stringify(PROFIT_CALCULATOR_FAQS)
    expect(blob).not.toMatch(/\b\d{3,}\s+orders\b/i)
    expect(blob).not.toMatch(/\$[\d,]+\s*\/\s*mo/)
  })

  it('publishes three how-to guides that link the calculator topic and stay indexable', () => {
    const slugs = [
      'maximum-ad-cost-per-sale',
      'shipping-cost-and-dropshipping-margin',
      'when-to-scale-dropshipping-ads',
    ]
    const paths = marketingPaths().map(entry => entry.path)
    for (const slug of slugs) {
      const guide = guideBySlug(slug)
      expect(guide?.howTo).toBe(true)
      expect(guide?.faqs?.length).toBeGreaterThanOrEqual(3)
      expect(guide?.description.length).toBeLessThanOrEqual(160)
      expect(documentTitle(guide?.metaTitle ?? '').length).toBeLessThanOrEqual(60)
      expect(paths).toContain(`/guides/${slug}`)
      const graph = JSON.stringify(guideStructuredData(guide!))
      expect(graph).toContain('"@type":"HowTo"')
      expect(graph).toContain('"@type":"FAQPage"')
      expect(graph).toContain(`/guides/${slug}`)
    }
    expect(new Set(GUIDES.map(guide => guide.slug)).size).toBe(GUIDES.length)
    const titles = GUIDES.map(guide => documentTitle(guide.metaTitle))
    expect(new Set(titles).size).toBe(titles.length)
  })
})
