import { adsConfig, type AdsConfig } from '@/lib/ads-config'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export type AdsConversion = 'signup' | 'idea-checker-complete' | 'purchase'

export interface PurchaseConversion {
  transactionId: string
  valueCents: number | null
  currency: string | null
}

export interface ConversionCall {
  channel: 'meta' | 'ga4' | 'google-ads'
  name: string
  params: Record<string, string | number>
}

function purchaseValue(purchase: PurchaseConversion | undefined): { value: number; currency: string } | null {
  if (!purchase) return null
  if (purchase.valueCents === null || !Number.isInteger(purchase.valueCents) || purchase.valueCents <= 0) return null
  const currency = purchase.currency?.trim().toUpperCase()
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return null
  return { value: purchase.valueCents / 100, currency }
}

export function conversionCalls(
  event: AdsConversion,
  config: AdsConfig,
  purchase?: PurchaseConversion,
): ConversionCall[] {
  const calls: ConversionCall[] = []
  switch (event) {
    case 'signup':
      if (config.metaPixelId) calls.push({ channel: 'meta', name: 'CompleteRegistration', params: {} })
      if (config.gaMeasurementId) calls.push({ channel: 'ga4', name: 'sign_up', params: {} })
      if (config.googleAdsId && config.googleAdsSignupLabel) {
        calls.push({
          channel: 'google-ads',
          name: 'conversion',
          params: { send_to: `${config.googleAdsId}/${config.googleAdsSignupLabel}` },
        })
      }
      return calls
    case 'idea-checker-complete':
      if (config.metaPixelId) calls.push({ channel: 'meta', name: 'Lead', params: {} })
      if (config.gaMeasurementId) calls.push({ channel: 'ga4', name: 'generate_lead', params: {} })
      if (config.googleAdsId && config.googleAdsLeadLabel) {
        calls.push({
          channel: 'google-ads',
          name: 'conversion',
          params: { send_to: `${config.googleAdsId}/${config.googleAdsLeadLabel}` },
        })
      }
      return calls
    case 'purchase': {
      if (!purchase?.transactionId) return calls
      const money = purchaseValue(purchase)
      const metaParams: Record<string, string | number> = {}
      const gaParams: Record<string, string | number> = { transaction_id: purchase.transactionId }
      const adsParams: Record<string, string | number> = {
        send_to: config.googleAdsId && config.googleAdsPurchaseLabel
          ? `${config.googleAdsId}/${config.googleAdsPurchaseLabel}`
          : '',
        transaction_id: purchase.transactionId,
      }
      if (money) {
        metaParams.value = money.value
        metaParams.currency = money.currency
        gaParams.value = money.value
        gaParams.currency = money.currency
        adsParams.value = money.value
        adsParams.currency = money.currency
      }
      if (config.metaPixelId) calls.push({ channel: 'meta', name: 'Purchase', params: metaParams })
      if (config.gaMeasurementId) calls.push({ channel: 'ga4', name: 'purchase', params: gaParams })
      if (config.googleAdsId && config.googleAdsPurchaseLabel) {
        calls.push({ channel: 'google-ads', name: 'conversion', params: adsParams })
      }
      return calls
    }
    default: {
      const exhaustive: never = event
      return exhaustive
    }
  }
}

function ensureGtag(): void {
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag === 'function') return
  window.gtag = function gtag() {
    // gtag.js reads this Arguments queue. A rest-array push is not the same contract.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments as unknown as never)
  }
}

export function trackAdsConversion(event: AdsConversion, purchase?: PurchaseConversion): void {
  if (typeof window === 'undefined') return
  const config = adsConfig()
  try {
    for (const call of conversionCalls(event, config, purchase)) {
      if (call.channel === 'meta' && typeof window.fbq === 'function') {
        window.fbq('track', call.name, call.params)
      }
      if (call.channel === 'ga4' || call.channel === 'google-ads') {
        ensureGtag()
        window.gtag?.('event', call.name, call.params)
      }
    }
  } catch {
    // Ad tags must not block signup, the checker, or billing.
  }
}
