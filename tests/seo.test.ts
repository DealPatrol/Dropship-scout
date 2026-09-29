import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GUIDES } from '@/lib/marketing/content'
import { documentTitle, metadataTitle, storeShouldIndex, TITLE_SUFFIX } from '@/lib/seo'
import { absoluteUrl, siteUrl } from '@/lib/site'

describe('seo', () => {
  it('keeps guide document titles within 60 characters', () => {
    for (const guide of GUIDES) {
      const titled = documentTitle(guide.metaTitle)
      expect(titled.length).toBeLessThanOrEqual(60)
      expect(titled).toBe(`${guide.metaTitle}${TITLE_SUFFIX}`)
      expect(metadataTitle(guide.metaTitle)).toBe(guide.metaTitle)
    }
  })

  it('uses the same origin for the homepage canonical and sitemap URL', () => {
    expect(absoluteUrl('/')).toBe(siteUrl())
    expect(absoluteUrl('/')).not.toMatch(/\/$/)
    expect(absoluteUrl('/pricing')).toBe(`${siteUrl()}/pricing`)
    expect(absoluteUrl('/guides/dropshipping-without-shopify')).toBe(`${siteUrl()}/guides/dropshipping-without-shopify`)
  })

  it('noindexes empty, demo, and test storefronts', () => {
    expect(storeShouldIndex('acme', 0)).toBe(false)
    expect(storeShouldIndex('demo', 4)).toBe(false)
    expect(storeShouldIndex('test-shop', 2)).toBe(false)
    expect(storeShouldIndex('sandbox-goods', 1)).toBe(false)
    expect(storeShouldIndex('acme', 2)).toBe(true)
    expect(storeShouldIndex('contest-goods', 1)).toBe(true)
    expect(storeShouldIndex('latest', 1)).toBe(true)
  })

  it('serves the IndexNow key exactly', () => {
    const key = readFileSync('public/0374cecd18315c00a18bb26e35f8b467.txt', 'utf8')
    expect(key).toBe('0374cecd18315c00a18bb26e35f8b467')
  })
})
