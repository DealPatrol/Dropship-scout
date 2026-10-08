import { describe, expect, it } from 'vitest'
import { parseBillingInterval, proAuthHref, selectProPriceId, settingsCheckoutSearch } from '@/lib/billing'
import { checkProductIdea, ideaQueryFromSearch, isIdeaCheckResult } from '@/lib/marketing/idea-check'
import { EXTRA_GUIDES } from '@/lib/marketing/extra-guides'
import { guideStructuredData } from '@/lib/marketing/content'
import { intentBySlug } from '@/lib/marketing/intent'
import { marketingPaths } from '@/lib/marketing/paths'
import { documentTitle, TITLE_SUFFIX } from '@/lib/seo'
import { normalizeWatchEmail, publicWatchError, watchSource } from '@/lib/watch-email'

const NEW_GUIDES = [
  'how-to-find-winning-products',
  'dropshipping-product-research-checklist',
  'how-to-validate-a-dropshipping-product-idea',
  'aliexpress-vs-cj-dropshipping',
  'dropshipping-niches-for-beginners',
  'how-to-spot-saturated-products',
  'tiktok-made-me-buy-it-products',
  'how-to-choose-a-dropshipping-supplier',
  'dropshipping-shipping-times',
  'what-to-check-before-buying-ads',
]

describe('product idea checker', () => {
  const base = {
    name: '  Sample lamp  ',
    shippingCost: 0,
    shippingCharge: 0,
    shipDays: 10,
    similarListings: 'few' as const,
    secondSupplier: 'yes' as const,
    sampleOrdered: true,
  }

  it('clears a fee-safe price and withholds a thin or negative remainder', () => {
    const healthy = checkProductIdea({ ...base, cost: 8, price: 30, shippingCost: 3 })
    expect(isIdeaCheckResult(healthy)).toBe(true)
    if (!isIdeaCheckResult(healthy)) return
    expect(healthy.name).toBe('Sample lamp')
    expect(healthy.viable).toBe(true)
    expect(healthy.remainderCents).toBe(1633)
    expect(healthy.notes.some(note => note.tone === 'ok')).toBe(true)

    const thin = checkProductIdea({ ...base, cost: 8, price: 12 })
    if (!isIdeaCheckResult(thin)) throw new Error('expected a result')
    expect(thin.viable).toBe(true)
    expect(thin.remainderCents).toBe(275)
    expect(thin.notes.some(note => note.text.includes('thin'))).toBe(true)

    const blocked = checkProductIdea({ ...base, cost: 9, price: 10 })
    if (!isIdeaCheckResult(blocked)) throw new Error('expected a result')
    expect(blocked.viable).toBe(false)
    expect(blocked.notes[0]?.tone).toBe('stop')
  })

  it('rejects bad amounts and long ship windows without inventing sales', () => {
    const bad = checkProductIdea({ ...base, cost: -1, price: 20 })
    expect(isIdeaCheckResult(bad)).toBe(false)
    const late = checkProductIdea({ ...base, cost: 8, price: 30, shipDays: 20 })
    if (!isIdeaCheckResult(late)) throw new Error('expected a result')
    expect(late.notes.some(note => note.text.includes('two weeks'))).toBe(true)
    const shared = ideaQueryFromSearch({ cost: '8', price: '30', shipCost: '3', days: '10', listings: 'few', supplier: 'yes', sample: '1' })
    expect(shared.result && isIdeaCheckResult(shared.result) && shared.result.remainderCents).toBe(1633)
    expect(ideaQueryFromSearch({}).result).toBeNull()
    const blob = JSON.stringify(late)
    expect(blob).not.toMatch(/\d+(\.\d+)?k\b/)
    expect(blob).not.toMatch(/\b\d{3,}\s+orders\b/i)
  })
})

describe('new guides', () => {
  it('publishes ten guides with FAQ schema, research links, and no sales claims', () => {
    expect(EXTRA_GUIDES).toHaveLength(10)
    const slugs = EXTRA_GUIDES.map(guide => guide.slug)
    for (const slug of NEW_GUIDES) expect(slugs).toContain(slug)
    const blob = JSON.stringify(EXTRA_GUIDES)
    expect(blob).not.toMatch(/\d+(\.\d+)?k\b/)
    expect(blob).not.toMatch(/\b\d{3,}\s+orders\b/i)
    expect(blob).not.toMatch(/\$[\d,]+\s*\/\s*mo/)
    for (const guide of EXTRA_GUIDES) {
      expect(documentTitle(guide.metaTitle)).toBe(`${guide.metaTitle}${TITLE_SUFFIX}`)
      expect(guide.faqs && guide.faqs.length).toBeGreaterThanOrEqual(2)
      expect(guide.relatedResearch && guide.relatedResearch.length).toBeGreaterThan(0)
      for (const related of guide.relatedResearch ?? []) {
        expect(intentBySlug(related)?.slug).toBe(related)
      }
      const graph = guideStructuredData(guide)
      expect(graph.some(node => (node as { '@type'?: string })['@type'] === 'Article')).toBe(true)
      expect(graph.some(node => (node as { '@type'?: string })['@type'] === 'FAQPage')).toBe(true)
    }
    const paths = marketingPaths(new Date('2026-10-08T12:00:00Z')).map(entry => entry.path)
    expect(paths).toContain('/research/idea-checker')
    expect(paths).toContain('/guides/how-to-find-winning-products')
    expect(paths).toContain('/guides/tiktok-made-me-buy-it-products')
  })
})

describe('products to watch', () => {
  it('normalizes emails and hides a missing database setting', () => {
    expect(normalizeWatchEmail('  Ada@Example.com ')).toBe('ada@example.com')
    expect(normalizeWatchEmail('not-an-email')).toBeNull()
    expect(watchSource('pricing')).toBe('pricing')
    expect(watchSource('nope')).toBe('products-to-watch')
    const failure = publicWatchError(new Error('Missing required environment variable: DATABASE_URL'))
    expect(failure.status).toBe(503)
    expect(failure.message).not.toContain('DATABASE_URL')
  })
})

describe('annual price selection', () => {
  it('uses the monthly price unless yearly billing was requested and configured', () => {
    expect(parseBillingInterval('year')).toBe('year')
    expect(parseBillingInterval('month')).toBe('month')
    expect(parseBillingInterval(undefined)).toBe('month')
    expect(selectProPriceId('month', { month: 'price_m', year: null })).toBe('price_m')
    expect(selectProPriceId('year', { month: 'price_m', year: 'price_y' })).toBe('price_y')
    expect(() => selectProPriceId('year', { month: 'price_m', year: null })).toThrow(/STRIPE_PRO_ANNUAL_PRICE_ID/)
    expect(proAuthHref('/auth/sign-up', 'year')).toBe('/auth/sign-up?plan=pro&interval=year')
    expect(settingsCheckoutSearch('year')).toBe('?checkout=1&interval=year')
    expect(settingsCheckoutSearch('month')).toBe('?checkout=1')
  })
})
