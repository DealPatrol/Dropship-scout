const DEFAULT_SITE_URL = 'https://dropship-scout.vercel.app'

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

/**
 * Public address on Cole Collins's GitHub account (DealPatrol).
 * No Dropship Scout inbox is published; replace this when one is.
 */
export const ORGANIZATION_EMAIL = '118781133+DealPatrol@users.noreply.github.com'
