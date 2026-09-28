const DEFAULT_SITE_URL = 'https://dropship-scout.vercel.app'

/** Public origin used for canonical URLs, sitemap, and Open Graph. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL
  return configured.replace(/\/$/, '')
}
