const DEFAULT_SITE_URL = 'https://getdropshipscout.com'

/** Public origin used for canonical URLs, sitemap, and Open Graph. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL
  return configured.replace(/\/$/, '')
}

/** Absolute URL with no trailing slash, including the site root. */
export function absoluteUrl(path: string): string {
  if (path === '' || path === '/') return siteUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl()}${normalized.replace(/\/$/, '')}`
}

export const SITE_NAME = 'Dropship Scout'

export const FOUNDER_NAME = 'Cole Collins'

/** Owner inbox used in public Organization structured data. */
export const ORGANIZATION_EMAIL = 'support@getdropshipscout.com'

/** Public support inbox shown on Contact, Privacy, Terms, and the footer. */
export const SUPPORT_EMAIL = ORGANIZATION_EMAIL
