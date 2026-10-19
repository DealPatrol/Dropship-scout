import { describe, expect, it } from 'vitest'
import { FUNNEL, hrefWithOrigin, resolveFunnelPath, sanitizeOriginPath } from '@/lib/analytics/origin'

describe('funnel origin', () => {
  it('keeps a content path and rejects open redirects', () => {
    expect(sanitizeOriginPath('/tools/dropshipping-profit-calculator')).toBe('/tools/dropshipping-profit-calculator')
    expect(sanitizeOriginPath('/guides/when-to-scale-dropshipping-ads?x=1')).toBe('/guides/when-to-scale-dropshipping-ads')
    expect(sanitizeOriginPath('https://evil.example/phish')).toBeNull()
    expect(sanitizeOriginPath('//evil.example')).toBeNull()
    expect(sanitizeOriginPath('/\\evil')).toBeNull()
    expect(sanitizeOriginPath('/%2f%2fevil.example')).toBeNull()
  })

  it('prefers the originating content page over auth and the current URL', () => {
    expect(resolveFunnelPath({
      query: '/tools/dropshipping-profit-calculator',
      stored: '/pricing',
      current: '/auth/sign-up',
    })).toBe('/tools/dropshipping-profit-calculator')
    expect(resolveFunnelPath({
      query: '/auth/sign-up',
      stored: '/guides/maximum-ad-cost-per-sale',
      current: '/auth/sign-up',
    })).toBe('/guides/maximum-ad-cost-per-sale')
    expect(resolveFunnelPath({
      query: null,
      stored: null,
      current: '/pricing',
    })).toBe('/pricing')
  })

  it('adds the origin to an internal signup link and names the funnel events', () => {
    expect(hrefWithOrigin('/auth/sign-up?plan=pro', '/tools/dropshipping-profit-calculator'))
      .toBe('/auth/sign-up?plan=pro&from=%2Ftools%2Fdropshipping-profit-calculator')
    expect(hrefWithOrigin('https://evil.example', '/pricing')).toBe('https://evil.example')
    expect(FUNNEL).toEqual({
      toolUsed: 'tool-used',
      ctaClicked: 'cta-clicked',
      signupClick: 'signup-click',
      checkoutStarted: 'checkout-started',
    })
  })
})
