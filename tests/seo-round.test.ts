import { describe, expect, it } from 'vitest'
import { GUIDES } from '@/lib/marketing/content'
import { marketingPaths } from '@/lib/marketing/paths'
import { googleSiteVerificationToken } from '@/lib/site-verification'

describe('seo round', () => {
  it('parses a Search Console token or meta tag and ignores junk', () => {
    expect(googleSiteVerificationToken('abcDEF123_-xyz')).toBe('abcDEF123_-xyz')
    expect(googleSiteVerificationToken('<meta name="google-site-verification" content="abcDEF123_-xyz" />')).toBe('abcDEF123_-xyz')
    expect(googleSiteVerificationToken('')).toBeNull()
    expect(googleSiteVerificationToken('bad token')).toBeNull()
  })

  it('publishes the new buyer guides with FAQs in the sitemap', () => {
    const slugs = GUIDES.map(guide => guide.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const paths = marketingPaths().map(entry => entry.path)
    for (const slug of ['dropshipping-break-even-roas', 'how-to-test-a-product-with-a-small-ad-budget', 'dropshipping-return-policy']) {
      expect(paths).toContain(`/guides/${slug}`)
      expect(GUIDES.find(guide => guide.slug === slug)?.faqs?.length).toBeGreaterThanOrEqual(3)
    }
  })
})
