export interface AdsConfig {
  metaPixelId: string | null
  gaMeasurementId: string | null
  googleAdsId: string | null
  googleAdsSignupLabel: string | null
  googleAdsLeadLabel: string | null
  googleAdsPurchaseLabel: string | null
}

function clean(value: string | undefined): string {
  return value?.trim() ?? ''
}

function pixelId(value: string): string | null {
  return /^\d{5,20}$/.test(value) ? value : null
}

function gaId(value: string): string | null {
  return /^G-[A-Z0-9]+$/.test(value) ? value : null
}

function adsId(value: string): string | null {
  return /^AW-\d+$/.test(value) ? value : null
}

function label(value: string): string | null {
  return /^[A-Za-z0-9_-]{1,40}$/.test(value) ? value : null
}

export function adsConfigFromEnv(env: Record<string, string | undefined>): AdsConfig {
  return {
    metaPixelId: pixelId(clean(env.NEXT_PUBLIC_META_PIXEL_ID)),
    gaMeasurementId: gaId(clean(env.NEXT_PUBLIC_GA_MEASUREMENT_ID)),
    googleAdsId: adsId(clean(env.NEXT_PUBLIC_GOOGLE_ADS_ID)),
    googleAdsSignupLabel: label(clean(env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL)),
    googleAdsLeadLabel: label(clean(env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL)),
    googleAdsPurchaseLabel: label(clean(env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL)),
  }
}

export function adsConfig(): AdsConfig {
  return adsConfigFromEnv(process.env)
}

export function adsTagsEnabled(config: AdsConfig = adsConfig()): boolean {
  return Boolean(config.metaPixelId || config.gaMeasurementId || config.googleAdsId)
}

export function purchaseTagsEnabled(config: AdsConfig = adsConfig()): boolean {
  return Boolean(
    config.metaPixelId ||
    config.gaMeasurementId ||
    (config.googleAdsId && config.googleAdsPurchaseLabel)
  )
}
