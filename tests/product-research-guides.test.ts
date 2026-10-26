import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { GUIDES, guideBySlug, guideStructuredData } from '@/lib/marketing/content'
import { allIntentPages, intentBySlug } from '@/lib/marketing/intent'
import { marketingPaths } from '@/lib/marketing/paths'
import { PRODUCT_RESEARCH_GUIDES } from '@/lib/marketing/product-research-guides'
import { documentTitle } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

const SLUGS = [
  'how-to-find-winning-dropshipping-products',
  'dropshipping-product-validation-checklist',
  'seasonal-dropshipping-niche-ideas',
  'compare-dropshipping-product-research-tools',
  'sell-the-trend-vs-dropship-scout',
  'minea-vs-dropship-scout',
  'ecomhunt-vs-dropship-scout',
]

const HOW_TO = [
  'how-to-find-winning-dropshipping-products',
  'dropshipping-product-validation-checklist',
  'seasonal-dropshipping-niche-ideas',
  'compare-dropshipping-product-research-tools',
]

describe('product research guides', () => {
  it('publishes the buyer-intent pages with FAQ schema, canonical paths, and no borrowed sales claims', () => {
    expect(PRODUCT_RESEARCH_GUIDES).toHaveLength(SLUGS.length)
    const paths = marketingPaths().map(entry => entry.path)
    const guideTitles = GUIDES.map(guide => documentTitle(guide.metaTitle))
    expect(new Set(guideTitles).size).toBe(guideTitles.length)
    const researchTitles = allIntentPages().map(page => documentTitle(page.metaTitle))
    const blob = JSON.stringify(PRODUCT_RESEARCH_GUIDES)
    expect(blob).toContain(`$${PRO_MONTHLY_PRICE_USD} a month`)
    expect(blob).not.toMatch(/\d+(\.\d+)?k\b/i)
    expect(blob).not.toMatch(/\b\d{3,}\s+orders\b/i)
    expect(blob).not.toMatch(/\$[\d,]+\s*\/\s*mo/)
    expect(blob).not.toMatch(/11 million|#1|trusted by|users worldwide/i)
    for (const slug of SLUGS) {
      const guide = guideBySlug(slug)
      expect(guide?.slug).toBe(slug)
      expect(guide?.faqs?.length).toBeGreaterThanOrEqual(3)
      expect(guide?.description.length).toBeGreaterThan(50)
      expect(guide?.description.length).toBeLessThanOrEqual(160)
      expect(documentTitle(guide?.metaTitle ?? '').length).toBeLessThanOrEqual(60)
      expect(paths).toContain(`/guides/${slug}`)
      expect(researchTitles).not.toContain(documentTitle(guide?.metaTitle ?? ''))
      for (const related of guide?.relatedResearch ?? []) {
        expect(intentBySlug(related)?.slug).toBe(related)
      }
      for (const related of guide?.relatedGuides ?? []) {
        expect(guideBySlug(related)?.slug).toBe(related)
        expect(related).not.toBe(slug)
      }
      const graph = JSON.stringify(guideStructuredData(guide!))
      expect(graph).toContain('"@type":"FAQPage"')
      expect(graph).toContain('"@type":"Article"')
      expect(graph).toContain(`"mainEntityOfPage":"${absoluteUrl(`/guides/${slug}`)}"`)
      if (HOW_TO.includes(slug)) expect(graph).toContain('"@type":"HowTo"')
    }
  })

  it('links the new guides from research pages and the free-tool signup path', () => {
    expect(intentBySlug('winning-dropshipping-products')?.relatedGuides).toContain('how-to-find-winning-dropshipping-products')
    expect(intentBySlug('dropshipping-product-research-tool')?.relatedGuides).toContain('sell-the-trend-vs-dropship-scout')
    expect(intentBySlug('dropshipping-niche-ideas')?.relatedGuides).toContain('seasonal-dropshipping-niche-ideas')
    expect(intentBySlug('best-products-to-dropship-in-fall')?.relatedGuides).toContain('seasonal-dropshipping-niche-ideas')
    const ideaChecker = readFileSync('app/research/idea-checker/page.tsx', 'utf8')
    expect(ideaChecker).toContain('location="idea-checker"')
    expect(ideaChecker).toContain('/guides/dropshipping-product-validation-checklist')
    const resultCta = readFileSync('components/marketing/idea-checker.tsx', 'utf8')
    expect(resultCta).toContain('location="idea-checker-result-pro"')
    expect(resultCta).toContain('/auth/sign-up?plan=pro')
    const preview = readFileSync('components/dashboard/launch-workbench.tsx', 'utf8')
    expect(preview).toContain('location="launch-preview"')
    expect(preview).toContain('location="launch-preview-pro"')
  })
})
