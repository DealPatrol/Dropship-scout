import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { marketingPaths } from '@/lib/marketing/paths'
import { calculateSaleDiscount } from '@/lib/marketing/sale-discount'
import { documentTitle } from '@/lib/seo'
import { sitemapLastModified } from '@/lib/marketing/sitemap-dates'
import type { CatalogProduct } from '@/lib/merchandising/types'
import {
  WEEKEND_DESK_DESCRIPTION,
  WEEKEND_DESK_PATH,
  WEEKEND_DESK_TITLE,
  rankWeekendProducts,
  shippingForSampleCost,
  weekendDesk,
  type DeskAssumptions,
} from '@/lib/weekend-desk'

const assumptions: DeskAssumptions = {
  paymentFeePercent: 2.9,
  paymentFeeFlat: 0.3,
  platformFeePercent: 5,
  returnsReservePercent: 5,
  adCostPerOrder: 8,
  saleAdCostPerOrder: 10,
  discountPercent: 20,
}

function product(overrides: Partial<CatalogProduct> & Pick<CatalogProduct, 'id' | 'name' | 'cost' | 'price'>): CatalogProduct {
  return {
    niches: ['home'],
    monthlyOrders: 100,
    rating: 4.5,
    competition: 'Medium',
    shippingDays: 8,
    supplierCount: 4,
    suppliers: ['cjdropship'],
    trend: 'stable',
    demand: 50,
    trendStability: 50,
    seasonality: 'seasonal',
    peakMonths: [11],
    holidays: ['black_friday'],
    audience: 'Households',
    adPlatform: 'Facebook',
    impulse: false,
    recurring: false,
    bundleWith: [],
    tags: [],
    ...overrides,
  }
}

describe('weekend cash desk', () => {
  it('keeps a product that still leaves money and drops one that does not', () => {
    const desk = rankWeekendProducts([
      product({ id: 'wide', name: 'Wide margin blanket', cost: 16, price: 70 }),
      product({ id: 'cheap', name: 'Cheap gift', cost: 8, price: 16 }),
    ], assumptions)
    expect(desk.hold.map(item => item.id)).toContain('wide')
    expect(desk.hold.every(item => item.saleProfit > 0)).toBe(true)
    expect(desk.hold.map(item => item.id)).not.toContain('cheap')
    expect(desk.stop.map(item => item.id)).toContain('cheap')
  })

  it('ignores declining products and heavy freight', () => {
    const desk = rankWeekendProducts([
      product({ id: 'falling', name: 'Falling lamp', cost: 10, price: 40, trend: 'declining' }),
      product({ id: 'heavy', name: 'Walking pad', cost: 89, price: 199 }),
    ], assumptions)
    expect(desk.hold).toHaveLength(0)
    expect(desk.stop).toHaveLength(0)
  })

  it('uses a higher ship assumption as sample cost rises', () => {
    expect(shippingForSampleCost(10)).toBe(4)
    expect(shippingForSampleCost(20)).toBe(6)
    expect(shippingForSampleCost(30)).toBe(12)
  })

  it('matches the sale calculator on a held product', () => {
    const desk = rankWeekendProducts([
      product({ id: 'wide', name: 'Wide margin blanket', cost: 16, price: 70 }),
    ], assumptions)
    const row = desk.hold[0]
    const again = calculateSaleDiscount({
      regularPrice: 70,
      unitCost: 16,
      shippingCost: shippingForSampleCost(16),
      paymentFeePercent: assumptions.paymentFeePercent,
      paymentFeeFlat: assumptions.paymentFeeFlat,
      platformFeePercent: assumptions.platformFeePercent,
      returnsReservePercent: assumptions.returnsReservePercent,
      adCostPerOrder: assumptions.adCostPerOrder,
      saleAdCostPerOrder: assumptions.saleAdCostPerOrder,
      discountPercent: assumptions.discountPercent,
    })
    expect(row.saleProfit).toBeCloseTo(again.saleProfit, 6)
    expect(row.listing).not.toMatch(/orders|demand|best seller/i)
  })

  it('does not publish order counts from the sample catalog', () => {
    const desk = weekendDesk(assumptions)
    const blob = JSON.stringify({ hold: desk.hold, stop: desk.stop })
    expect(blob).not.toMatch(/monthlyOrders/)
    expect(desk.hold.every(item => item.saleProfit > 0)).toBe(true)
    expect(readFileSync('app/tools/weekend-cash-desk/page.tsx', 'utf8')).not.toMatch(/monthlyOrders/)
  })

  it('is in the sitemap with a short title and description', () => {
    expect(marketingPaths().map(entry => entry.path)).toContain(WEEKEND_DESK_PATH)
    expect(documentTitle(WEEKEND_DESK_TITLE).length).toBeLessThanOrEqual(60)
    expect(WEEKEND_DESK_DESCRIPTION.length).toBeLessThanOrEqual(160)
    expect(readFileSync('public/llms.txt', 'utf8')).toContain(WEEKEND_DESK_PATH)
    expect(sitemapLastModified(WEEKEND_DESK_PATH).toISOString().slice(0, 10)).toBe('2026-11-26')
  })
})
