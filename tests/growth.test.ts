import { describe, expect, it } from 'vitest'
import { publicCheckoutError } from '@/lib/billing'
import { allIntentPages, intentBySlug } from '@/lib/marketing/intent'
import { marketingPaths } from '@/lib/marketing/paths'
import { productsForSeason, publicCatalog, seasonForDate } from '@/lib/marketing/public-catalog'
import { safeNextPath } from '@/lib/paths'
import { publicSalesNote } from '@/lib/sales-note'
import { documentTitle, TITLE_SUFFIX } from '@/lib/seo'

const REQUIRED_SLUGS = [
  'winning-dropshipping-products',
  'dropshipping-product-research-tool',
  'best-products-to-dropship-in-fall',
  'shopify-product-research',
  'tiktok-trending-products-to-sell',
]

describe('buyer-intent pages', () => {
  it('publishes at least 10 research pages, including the requested queries', () => {
    const pages = allIntentPages()
    expect(pages.length).toBeGreaterThanOrEqual(10)
    for (const slug of REQUIRED_SLUGS) {
      expect(intentBySlug(slug)?.slug).toBe(slug)
    }
    const titles = new Set(pages.map(page => page.slug))
    expect(titles.size).toBe(pages.length)
  })

  it('keeps research document titles within 60 characters and out of invented sales claims', () => {
    const blob = JSON.stringify(allIntentPages())
    expect(blob).not.toMatch(/\d+(\.\d+)?k\b/)
    expect(blob).not.toMatch(/\b\d{3,}\s+orders\b/i)
    expect(blob).not.toMatch(/\$[\d,]+\s*\/\s*mo/)
    for (const page of allIntentPages()) {
      const titled = documentTitle(page.metaTitle)
      expect(titled.length).toBeLessThanOrEqual(60)
      expect(titled).toBe(`${page.metaTitle}${TITLE_SUFFIX}`)
      expect(page.sections.length).toBeGreaterThan(0)
      expect(page.faqs.length).toBeGreaterThan(0)
    }
  })

  it('puts research, pricing, and the preview on the sitemap', () => {
    const paths = marketingPaths(new Date('2026-10-08T12:00:00Z')).map(entry => entry.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/pricing')
    expect(paths).toContain('/research')
    expect(paths).toContain('/research/preview')
    expect(paths).toContain('/research/best-products-to-dropship-in-fall')
    expect(paths.filter(path => path.startsWith('/research/')).length).toBeGreaterThanOrEqual(12)
  })
})

describe('sample catalog preview', () => {
  it('treats October 2026 as fall and omits order counts', () => {
    expect(seasonForDate(new Date('2026-10-08T12:00:00Z'))).toBe('fall')
    expect(seasonForDate(new Date('2026-01-15T12:00:00Z'))).toBe('winter')
    expect(seasonForDate(new Date('2026-04-02T12:00:00Z'))).toBe('spring')
    expect(seasonForDate(new Date('2026-07-04T12:00:00Z'))).toBe('summer')
    const row = publicCatalog()[0]
    expect(row).not.toHaveProperty('monthlyOrders')
    expect(row).not.toHaveProperty('demand')
    const fall = productsForSeason('fall')
    expect(fall.some(product => product.name === 'Electric Heated Blanket')).toBe(true)
    expect(fall.some(product => product.name === 'Giant Inflatable Pool Float')).toBe(false)
  })
})

describe('paid plan path', () => {
  it('rejects open redirects and maps missing Stripe keys to a public error', () => {
    expect(safeNextPath('/dashboard/settings?checkout=1')).toBe('/dashboard/settings?checkout=1')
    expect(safeNextPath('https://evil.example/phish')).toBeNull()
    expect(safeNextPath('//evil.example')).toBeNull()
    expect(safeNextPath('/%2f%2fevil.example')).toBeNull()
    const failure = publicCheckoutError(new Error('Missing required environment variable: STRIPE_SECRET_KEY'))
    expect(failure.status).toBe(503)
    expect(failure.message).not.toContain('STRIPE_SECRET_KEY')
  })
})

describe('sales notes', () => {
  it('hides numeric sales claims', () => {
    expect(publicSalesNote('2.1k')).toBe('Not verified')
    expect(publicSalesNote('3200')).toBe('Not verified')
    expect(publicSalesNote('Not verified')).toBe('Not verified')
    expect(publicSalesNote('')).toBe('Not verified')
    expect(publicSalesNote('9.2k orders')).toBe('Not verified')
  })
})
