import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PRO_MONTHLY_PRICE_LABEL, PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { PRICING_FAQ } from '@/lib/marketing/content'
import { marketingPaths } from '@/lib/marketing/paths'
import { documentTitle, proOfferJsonLd, softwareApplicationJsonLd } from '@/lib/seo'
import { SUPPORT_EMAIL } from '@/lib/site'

const read = (path: string) => readFileSync(path, 'utf8')

describe('published Pro price', () => {
  it('is $29/month everywhere it is shown', () => {
    expect(PRO_MONTHLY_PRICE_USD).toBe(29)
    expect(PRO_MONTHLY_PRICE_LABEL).toBe('$29/month')
    expect(read('app/pricing/page.tsx')).toContain('PRO_MONTHLY_PRICE_USD')
    expect(read('app/pricing/page.tsx')).not.toContain('does not publish a dollar amount')
    expect(PRICING_FAQ.find(item => item.question === 'How is Pro billed?')?.answer).toContain('$29 per month')
  })

  it('is in structured data as a monthly USD offer', () => {
    const offer = proOfferJsonLd()
    expect(offer.price).toBe('29')
    expect(offer.priceCurrency).toBe('USD')
    expect(offer.priceSpecification.billingDuration).toBe('P1M')
    expect(softwareApplicationJsonLd().offers).toHaveLength(2)
  })
})

describe('company pages', () => {
  it('are on the sitemap and linked from the footer', () => {
    const paths = marketingPaths(new Date('2026-10-09')).map(entry => entry.path)
    const footer = read('components/marketing/site-frame.tsx')
    for (const path of ['/about', '/contact', '/privacy', '/terms']) {
      expect(paths).toContain(path)
      expect(footer).toContain(`href="${path}"`)
    }
  })

  it('show a real support address', () => {
    expect(SUPPORT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    expect(read('app/contact/page.tsx')).toContain('SUPPORT_EMAIL')
  })
})

describe('homepage and Pro checkout', () => {
  it('uses a branded research title and links the public launch workspace', () => {
    const home = read('app/page.tsx')
    const title = 'Dropshipping product research'
    expect(home).toContain(`title: '${title}'`)
    expect(documentTitle(title)).toBe(`${title} · Dropship Scout`)
    expect(documentTitle(title).length).toBeLessThanOrEqual(60)
    expect(documentTitle('Dropshipping launch workspace').length).toBeLessThanOrEqual(60)
    expect(home).toContain('href="/launch-preview"')
    expect(home).toContain('3 saved launch workspaces')
    expect(marketingPaths().map(entry => entry.path)).toContain('/launch-preview')
  })

  it('opens Stripe checkout from the launch-workspace cap', () => {
    const workbench = read('components/dashboard/launch-workbench.tsx')
    const settings = read('components/dashboard/settings-view.tsx')
    expect(workbench).toContain("result.code === 'PLAN_LIMIT'")
    expect(workbench).toContain('source="launch-limit"')
    expect(workbench).toContain('PRO_MONTHLY_PRICE_USD')
    expect(settings).toContain('Continue to Pro checkout')
    expect(settings).toContain('PRO_MONTHLY_PRICE_USD')
    expect(settings).toContain('3 saved launch workspaces')
    expect(settings).toContain('50 saved launch workspaces')
  })

  it('keeps public FAQ answers free of operator environment names', () => {
    const faq = read('lib/marketing/content.ts')
    const free = PRICING_FAQ.find(item => item.question === 'What does the free plan include?')?.answer ?? ''
    expect(free).toContain('3 launch workspaces')
    expect(free).toContain('50 saved launch workspaces')
    expect(free).toContain('$29 per month')
    expect(free).not.toMatch(/unlimited launch/i)
    expect(faq).not.toContain('STRIPE_LIVE_MODE')
    expect(faq).not.toContain('SUPPLIER_ORDERS_MODE')
  })
})

describe('honest trust signals', () => {
  it('marketing pages make no fabricated social-proof claims', () => {
    const files = [
      'app/page.tsx',
      'app/pricing/page.tsx',
      'app/about/page.tsx',
      'app/contact/page.tsx',
      'components/marketing/site-frame.tsx',
    ]
    const banned = [/trusted by/i, /#1\b/, /\bthousands of\b/i, /\bas seen (in|on)\b/i, /\baward/i, /\d+\s*stars?\b/i, /testimonial/i, /\bcertified\b/i]
    for (const file of files) {
      const text = read(file)
      for (const pattern of banned) expect(text, `${file} matches ${pattern}`).not.toMatch(pattern)
    }
  })
})
