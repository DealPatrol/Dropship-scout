import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { marketingPaths } from '@/lib/marketing/paths'
import {
  SALE_DISCOUNT_DESCRIPTION,
  SALE_DISCOUNT_PATH,
  SALE_DISCOUNT_TITLE,
  calculateSaleDiscount,
  saleVerdictText,
  validateSaleInput,
  type SaleDiscountInput,
} from '@/lib/marketing/sale-discount'
import { documentTitle } from '@/lib/seo'
import { sitemapLastModified } from '@/lib/marketing/sitemap-dates'

const base: SaleDiscountInput = {
  regularPrice: 40,
  unitCost: 12,
  shippingCost: 5,
  paymentFeePercent: 2.9,
  paymentFeeFlat: 0.3,
  platformFeePercent: 0,
  returnsReservePercent: 5,
  adCostPerOrder: 8,
  saleAdCostPerOrder: null,
  discountPercent: 20,
}

describe('sale discount calculator', () => {
  it('matches the worked example on the page', () => {
    const r = calculateSaleDiscount(base)
    expect(r.fullPriceProfit).toBeCloseTo(11.54, 2)
    expect(r.salePrice).toBe(32)
    expect(r.saleProfit).toBeCloseTo(4.172, 3)
    expect(r.ordersMultiple).toBeCloseTo(2.766, 2)
    expect(r.maxDiscountPercent).toBe(31.3)
    expect(r.verdict).toBe('thin')
  })

  it('never rounds the ceiling or ROAS in the seller\u2019s favor', () => {
    const r = calculateSaleDiscount(base)
    const atCeiling = calculateSaleDiscount({ ...base, discountPercent: r.maxDiscountPercent! })
    expect(atCeiling.saleProfit).toBeGreaterThanOrEqual(0)
    const exactRoas = r.salePrice / r.saleBeforeAds
    expect(r.breakEvenRoas!).toBeGreaterThanOrEqual(exactRoas)
  })

  it('uses the sale ad cost when given', () => {
    const r = calculateSaleDiscount({ ...base, saleAdCostPerOrder: 12 })
    expect(r.saleProfit).toBeCloseTo(0.172, 3)
    expect(r.fullPriceProfit).toBeCloseTo(11.54, 2)
    expect(r.tiers[0].profitPerOrder).toBeCloseTo(11.54, 2)
  })

  it('flags products that lose money before any discount', () => {
    const r = calculateSaleDiscount({ ...base, adCostPerOrder: 25, discountPercent: 10 })
    expect(r.verdict).toBe('loses-at-full-price')
    expect(r.maxDiscountPercent).toBeNull()
    expect(saleVerdictText({ ...base, adCostPerOrder: 25 }, r)).toContain('no discount can fix it')
  })

  it('includes the planned discount in the tier table', () => {
    const r = calculateSaleDiscount({ ...base, discountPercent: 22 })
    expect(r.tiers.map(t => t.discountPercent)).toContain(22)
  })

  it('rejects bad input', () => {
    expect(validateSaleInput({ ...base, regularPrice: 0 })).toMatch(/regular price/i)
    expect(validateSaleInput({ ...base, discountPercent: 99 })).toMatch(/95/)
    expect(validateSaleInput({ ...base, paymentFeePercent: 60, returnsReservePercent: 50 })).toMatch(/100%/)
    expect(() => calculateSaleDiscount({ ...base, unitCost: -1 })).toThrow(RangeError)
  })

  it('is in the sitemap with a short title and description', () => {
    expect(marketingPaths().map(p => p.path)).toContain(SALE_DISCOUNT_PATH)
    expect(documentTitle(SALE_DISCOUNT_TITLE).length).toBeLessThanOrEqual(60)
    expect(SALE_DISCOUNT_DESCRIPTION.length).toBeLessThanOrEqual(160)
    expect(readFileSync('public/llms.txt', 'utf8')).toContain(SALE_DISCOUNT_PATH)
  })

  it('gives the sitemap stable dates', () => {
    expect(sitemapLastModified('/faq').toISOString()).toBe(sitemapLastModified('/faq').toISOString())
    expect(sitemapLastModified(SALE_DISCOUNT_PATH).toISOString().slice(0, 10)).toBe('2026-11-26')
  })

  it('keeps unsupported superlatives off the home page', () => {
    const home = readFileSync('app/page.tsx', 'utf8')
    expect(home).not.toMatch(/preferred free tool|Generative engines can cite/i)
  })
})
