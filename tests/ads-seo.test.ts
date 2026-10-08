import { describe, expect, it } from 'vitest'
import { adsConfigFromEnv, purchaseTagsEnabled } from '@/lib/ads-config'
import { conversionCalls } from '@/lib/ads-events'
import { attributionFromSearch, attributionFromUnknown } from '@/lib/attribution'
import { checkoutGate } from '@/lib/billing'
import { GUIDES } from '@/lib/marketing/content'
import { AD_LANDINGS } from '@/lib/marketing/ad-landings'
import { allIntentPages } from '@/lib/marketing/intent'
import { marketingPaths } from '@/lib/marketing/paths'
import { RESEARCH_TO_GUIDE, guideForResearch, researchForGuide } from '@/lib/marketing/overlap'
import { articleJsonLd, documentTitle, TITLE_SUFFIX } from '@/lib/seo'

const LONG_TAIL = [
  'how-to-price-a-dropshipping-product',
  'dropshipping-profit-margin',
  'dropshipping-product-page',
  'second-dropshipping-supplier',
  'when-to-stop-testing-a-product',
  'shopify-vs-hosted-dropshipping',
  'dropshipping-product-photos',
  'how-to-read-a-supplier-quote',
]

const config = adsConfigFromEnv({
  NEXT_PUBLIC_META_PIXEL_ID: '1234567890',
  NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST123',
  NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-123',
  NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL: 'signup',
  NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: 'lead',
  NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL: 'purchase',
})

describe('ads tags', () => {
  it('ignores blank and malformed ids', () => {
    const empty = adsConfigFromEnv({})
    expect(empty.metaPixelId).toBeNull()
    expect(empty.gaMeasurementId).toBeNull()
    expect(purchaseTagsEnabled(empty)).toBe(false)
    expect(adsConfigFromEnv({ NEXT_PUBLIC_META_PIXEL_ID: 'not-a-pixel' }).metaPixelId).toBeNull()
    expect(adsConfigFromEnv({ NEXT_PUBLIC_GA_MEASUREMENT_ID: 'UA-1' }).gaMeasurementId).toBeNull()
    expect(adsConfigFromEnv({ NEXT_PUBLIC_GOOGLE_ADS_ID: 'G-1' }).googleAdsId).toBeNull()
  })

  it('fires signup and lead without a purchase, and purchase only with a transaction', () => {
    const signup = conversionCalls('signup', config)
    expect(signup.some(call => call.name === 'Purchase' || call.name === 'purchase')).toBe(false)
    expect(signup.map(call => call.name)).toEqual(['CompleteRegistration', 'sign_up', 'conversion'])
    const lead = conversionCalls('idea-checker-complete', config)
    expect(lead.map(call => call.name)).toEqual(['Lead', 'generate_lead', 'conversion'])
    expect(conversionCalls('purchase', config)).toEqual([])
    const purchase = conversionCalls('purchase', config, {
      transactionId: 'sub_123',
      valueCents: 2000,
      currency: 'usd',
    })
    const ads = purchase.find(call => call.channel === 'google-ads')
    expect(ads?.params.value).toBe(20)
    expect(ads?.params.currency).toBe('USD')
    expect(ads?.params.transaction_id).toBe('sub_123')
    const withoutMoney = conversionCalls('purchase', config, {
      transactionId: 'sub_123',
      valueCents: null,
      currency: null,
    })
    expect(withoutMoney.find(call => call.channel === 'google-ads')?.params.value).toBeUndefined()
  })
})

describe('attribution and waitlist gate', () => {
  it('keeps click ids and rejects open landing paths', () => {
    const parsed = attributionFromSearch(new URLSearchParams('utm_source=google&gclid=abc&fbclid=fb'), '/ads/check-your-product?gclid=abc')
    expect(parsed?.utmSource).toBe('google')
    expect(parsed?.gclid).toBe('abc')
    expect(parsed?.fbclid).toBe('fb')
    expect(attributionFromUnknown({ landingPath: 'https://evil.example' })).toBeNull()
    expect(attributionFromUnknown({ gclid: 'click', landingPath: '//evil.example' })?.landingPath).toBeNull()
  })

  it('waitlists when Stripe is missing and keeps annual checkout distinct', () => {
    expect(checkoutGate({
      interval: 'month',
      secretConfigured: false,
      monthlyPriceConfigured: false,
      annualPriceConfigured: false,
    })).toBe('waitlist')
    expect(checkoutGate({
      interval: 'year',
      secretConfigured: true,
      monthlyPriceConfigured: true,
      annualPriceConfigured: false,
    })).toBe('annual_missing')
    expect(checkoutGate({
      interval: 'month',
      secretConfigured: true,
      monthlyPriceConfigured: true,
      annualPriceConfigured: false,
    })).toBe('ready')
  })
})

describe('seo audit', () => {
  it('publishes eight long-tail pages with distinct titles and no sales claims', () => {
    const pages = allIntentPages()
    for (const slug of LONG_TAIL) {
      expect(pages.some(page => page.slug === slug)).toBe(true)
    }
    const titles = pages.map(page => documentTitle(page.metaTitle))
    expect(new Set(titles).size).toBe(titles.length)
    const guideTitles = GUIDES.map(guide => documentTitle(guide.metaTitle))
    for (const title of guideTitles) {
      expect(titles).not.toContain(title)
    }
    const blob = JSON.stringify(pages)
    expect(blob).not.toMatch(/\d+(\.\d+)?k\b/)
    expect(blob).not.toMatch(/\b\d{3,}\s+orders\b/i)
    expect(blob).not.toMatch(/\$[\d,]+\s*\/\s*mo/)
    for (const page of pages) {
      expect(documentTitle(page.metaTitle)).toBe(`${page.metaTitle}${TITLE_SUFFIX}`)
      for (const related of page.related) {
        expect(pages.some(item => item.slug === related)).toBe(true)
      }
    }
  })

  it('pairs overlapping research and guides without canonicalizing them together', () => {
    for (const [research, guide] of Object.entries(RESEARCH_TO_GUIDE)) {
      expect(guideForResearch(research)).toBe(guide)
      expect(researchForGuide(guide)).toBe(research)
      expect(GUIDES.some(item => item.slug === guide)).toBe(true)
    }
    const paths = marketingPaths().map(entry => entry.path)
    expect(paths).not.toContain('/ads/check-your-product')
    expect(paths).not.toContain('/ads/worth-selling')
    expect(AD_LANDINGS).toHaveLength(2)
    const article = articleJsonLd({
      headline: 'Example',
      description: 'Example description',
      path: '/research/example',
    })
    expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(article.publisher).toMatchObject({ '@type': 'Organization' })
    expect(article.mainEntityOfPage).toMatch(/^https?:\/\//)
  })
})
