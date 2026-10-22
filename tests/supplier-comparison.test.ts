import { describe, expect, it } from 'vitest'
import { GUIDES, guideBySlug, guideStructuredData } from '@/lib/marketing/content'
import { marketingPaths } from '@/lib/marketing/paths'
import { SUPPLIER_GUIDES } from '@/lib/marketing/supplier-guides'
import {
  SUPPLIER_COMPARISON_DESCRIPTION,
  SUPPLIER_COMPARISON_FAQS,
  SUPPLIER_COMPARISON_PATH,
  SUPPLIER_COMPARISON_TITLE,
  compareSuppliers,
  comparisonHeading,
  comparisonNotes,
  comparisonSignal,
  emptySupplierFields,
  ideaCheckerSearch,
  isSupplierComparison,
  parseSupplierComparison,
  profitCalculatorSearch,
  shipWindowSentence,
  supplierComparisonSearch,
  supplierFieldsFromSearch,
  type SupplierCompareFields,
  type SupplierQuote,
} from '@/lib/marketing/supplier-comparison'
import { documentTitle } from '@/lib/seo'

function quote(overrides: Partial<SupplierQuote> & Pick<SupplierQuote, 'label'>): SupplierQuote {
  return {
    productCost: 10,
    shippingCost: 4,
    processingDays: 2,
    transitDays: 5,
    shipsToCountry: 'yes',
    ...overrides,
  }
}

function fields(overrides?: {
  a?: Partial<SupplierCompareFields['a']>
  b?: Partial<SupplierCompareFields['b']>
}): SupplierCompareFields {
  const base = emptySupplierFields()
  return {
    a: {
      ...base.a,
      label: 'North warehouse',
      productCost: '8',
      shippingCost: '4',
      processingDays: '2',
      transitDays: '5',
      shipsToCountry: 'yes',
      ...overrides?.a,
    },
    b: {
      ...base.b,
      label: 'South agent',
      productCost: '10',
      shippingCost: '5',
      processingDays: '3',
      transitDays: '8',
      shipsToCountry: 'yes',
      ...overrides?.b,
    },
  }
}

describe('supplier comparison', () => {
  it('adds landed cost and ship days, and names a quote that wins both', () => {
    const result = compareSuppliers(
      quote({ label: 'North warehouse', productCost: 8, shippingCost: 4, processingDays: 2, transitDays: 5 }),
      quote({ label: 'South agent', productCost: 10, shippingCost: 5, processingDays: 3, transitDays: 8 }),
    )
    expect(result.a.landedCost).toBe(12)
    expect(result.a.shipDays).toBe(7)
    expect(result.b.landedCost).toBe(15)
    expect(result.b.shipDays).toBe(11)
    expect(result.shape).toEqual({ kind: 'clear', winner: 'a', onCost: true, onTime: true })
    expect(comparisonSignal(result.shape)).toBe('clear')
    expect(comparisonHeading(result)).toBe('North warehouse is cheaper and faster on these quotes')
    expect(comparisonNotes(result).join(' ')).toMatch(/\$3\.00 cheaper and 4 days faster/)
  })

  it('keeps a faster quote when landed costs match, and a cheaper quote when the days match', () => {
    const faster = compareSuppliers(
      quote({ label: 'North warehouse', processingDays: 1, transitDays: 4 }),
      quote({ label: 'South agent', processingDays: 2, transitDays: 5 }),
    )
    expect(faster.shape).toEqual({ kind: 'clear', winner: 'a', onCost: false, onTime: true })
    expect(comparisonHeading(faster)).toMatch(/faster, and the landed costs match/)

    const cheaper = compareSuppliers(
      quote({ label: 'North warehouse', productCost: 6 }),
      quote({ label: 'South agent', productCost: 10 }),
    )
    expect(cheaper.a.shipDays).toBe(cheaper.b.shipDays)
    expect(cheaper.shape).toEqual({ kind: 'clear', winner: 'a', onCost: true, onTime: false })
  })

  it('states both gaps when one quote is cheaper and the other is faster', () => {
    const result = compareSuppliers(
      quote({ label: 'North warehouse', productCost: 6, shippingCost: 2, processingDays: 4, transitDays: 12 }),
      quote({ label: 'South agent', productCost: 11, shippingCost: 3, processingDays: 1, transitDays: 4 }),
    )
    expect(result.a.landedCost).toBe(8)
    expect(result.a.shipDays).toBe(16)
    expect(result.b.landedCost).toBe(14)
    expect(result.b.shipDays).toBe(5)
    expect(result.shape).toEqual({ kind: 'tradeoff', cheaper: 'a', faster: 'b' })
    expect(comparisonSignal(result.shape)).toBe('tradeoff')
    const notes = comparisonNotes(result).join(' ')
    expect(notes).toMatch(/\$6\.00 lower/)
    expect(notes).toMatch(/11 days faster/)
    expect(notes).toMatch(/Print the ship window/)
  })

  it('treats matching numbers as a tie and a refused country as out of the running', () => {
    const tie = compareSuppliers(
      quote({ label: 'North warehouse' }),
      quote({ label: 'South agent' }),
    )
    expect(tie.shape.kind).toBe('tie')
    expect(comparisonNotes(tie).join(' ')).toMatch(/sample/)

    const excluded = compareSuppliers(
      quote({ label: 'North warehouse', productCost: 1, shippingCost: 1, processingDays: 1, transitDays: 1, shipsToCountry: 'no' }),
      quote({ label: 'South agent', shipsToCountry: 'yes' }),
    )
    expect(excluded.shape).toEqual({ kind: 'one-excluded', kept: 'b' })
    expect(comparisonHeading(excluded)).toBe('Only South agent can ship to this country')
    expect(comparisonSignal(excluded.shape)).toBe('excluded')

    const unconfirmed = compareSuppliers(
      quote({ label: 'North warehouse', productCost: 1, shipsToCountry: 'unchecked' }),
      quote({ label: 'South agent', shipsToCountry: 'unchecked' }),
    )
    expect(unconfirmed.shape.kind).toBe('clear')
    expect(comparisonNotes(unconfirmed).join(' ')).toMatch(/not confirmed that North warehouse/)

    const neither = compareSuppliers(
      quote({ label: 'North warehouse', shipsToCountry: 'no' }),
      quote({ label: 'South agent', shipsToCountry: 'no' }),
    )
    expect(neither.shape.kind).toBe('both-excluded')
    expect(comparisonNotes(neither).join(' ')).not.toMatch(/idea checker/)
  })

  it('uses the same 7-day and 14-day disclosure cutoffs as the idea checker', () => {
    expect(shipWindowSentence(7)).toMatch(/week or less/)
    expect(shipWindowSentence(8)).toMatch(/longer than a week/)
    expect(shipWindowSentence(14)).toMatch(/longer than a week/)
    expect(shipWindowSentence(15)).toMatch(/longer than two weeks/)
  })

  it('rejects a missing cost, a fractional day, a window over 120, and two identical names', () => {
    const missing = parseSupplierComparison(fields({ a: { productCost: '' } }))
    expect(isSupplierComparison(missing)).toBe(false)

    const fraction = parseSupplierComparison(fields({ a: { transitDays: '2.5' } }))
    expect(isSupplierComparison(fraction)).toBe(false)
    if (!isSupplierComparison(fraction)) expect(fraction.error).toMatch(/whole number/)

    const long = parseSupplierComparison(fields({ a: { processingDays: '80', transitDays: '50' } }))
    expect(isSupplierComparison(long)).toBe(false)
    if (!isSupplierComparison(long)) expect(long.error).toMatch(/120/)

    const same = parseSupplierComparison(fields({ b: { label: 'north warehouse' } }))
    expect(isSupplierComparison(same)).toBe(false)

    const blank = parseSupplierComparison(fields({ a: { label: '' }, b: { label: '  ' } }))
    expect(isSupplierComparison(blank)).toBe(true)
    if (isSupplierComparison(blank)) {
      expect(blank.a.label).toBe('Supplier A')
      expect(blank.b.label).toBe('Supplier B')
    }
  })

  it('round-trips a shared comparison and links the idea checker without a price', () => {
    const shared = supplierComparisonSearch(fields({ b: { shipsToCountry: 'no' } }))
    const params = Object.fromEntries(new URL(shared, 'https://dropshipscout.local').searchParams)
    const parsed = parseSupplierComparison(supplierFieldsFromSearch(params))
    expect(isSupplierComparison(parsed)).toBe(true)
    if (!isSupplierComparison(parsed)) return
    expect(parsed.shape).toEqual({ kind: 'one-excluded', kept: 'a' })

    const href = ideaCheckerSearch({
      label: parsed.a.label,
      productCost: '8',
      shippingCost: '4',
      shipDays: parsed.a.shipDays,
      otherCoverage: parsed.b.shipsToCountry,
    })
    expect(href.startsWith('/research/idea-checker?')).toBe(true)
    const idea = new URL(href, 'https://dropshipscout.local')
    expect(idea.searchParams.get('price')).toBeNull()
    expect(idea.searchParams.get('cost')).toBe('8')
    expect(idea.searchParams.get('shipCost')).toBe('4')
    expect(idea.searchParams.get('days')).toBe('7')
    expect(idea.searchParams.get('supplier')).toBe('no')
    expect(idea.searchParams.get('name')).toBe('North warehouse')

    const profit = profitCalculatorSearch(fields().a)
    expect(profit).toBe('/tools/dropshipping-profit-calculator?cost=8&shipCost=4')
  })
})

describe('supplier comparison seo', () => {
  it('keeps the tool title, description, FAQs, and sitemap entry within search limits', () => {
    expect(SUPPLIER_COMPARISON_DESCRIPTION.length).toBeLessThanOrEqual(160)
    expect(SUPPLIER_COMPARISON_DESCRIPTION.length).toBeGreaterThan(50)
    expect(documentTitle(SUPPLIER_COMPARISON_TITLE).length).toBeLessThanOrEqual(60)
    expect(SUPPLIER_COMPARISON_FAQS.length).toBeGreaterThanOrEqual(3)
    const paths = marketingPaths().map(entry => entry.path)
    expect(paths).toContain(SUPPLIER_COMPARISON_PATH)
    const blob = JSON.stringify(SUPPLIER_COMPARISON_FAQS)
    expect(blob).not.toMatch(/\b\d{3,}\s+orders\b/i)
    expect(blob).not.toMatch(/\$[\d,]+\s*\/\s*mo/)
  })

  it('publishes three how-to guides that link the comparison topic and stay indexable', () => {
    expect(SUPPLIER_GUIDES).toHaveLength(3)
    const paths = marketingPaths().map(entry => entry.path)
    for (const guide of SUPPLIER_GUIDES) {
      expect(guide.howTo).toBe(true)
      expect(guide.faqs?.length).toBeGreaterThanOrEqual(3)
      expect(guide.description.length).toBeLessThanOrEqual(160)
      expect(guide.description.length).toBeGreaterThan(50)
      expect(documentTitle(guide.metaTitle).length).toBeLessThanOrEqual(60)
      expect(paths).toContain(`/guides/${guide.slug}`)
      expect(guideBySlug(guide.slug)?.slug).toBe(guide.slug)
      const graph = JSON.stringify(guideStructuredData(guide))
      expect(graph).toContain('"@type":"HowTo"')
      expect(graph).toContain('"@type":"FAQPage"')
      expect(graph).toContain(`/guides/${guide.slug}`)
    }
    expect(new Set(GUIDES.map(guide => guide.slug)).size).toBe(GUIDES.length)
    const titles = GUIDES.map(guide => documentTitle(guide.metaTitle))
    expect(new Set(titles).size).toBe(titles.length)
    const blob = JSON.stringify(SUPPLIER_GUIDES)
    expect(blob).not.toMatch(/\b\d{3,}\s+orders\b/i)
    expect(blob).not.toMatch(/\$[\d,]+\s*\/\s*mo/)
  })
})
