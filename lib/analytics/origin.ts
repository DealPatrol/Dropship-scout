const LOCAL_ORIGIN = 'https://dropshipscout.local'

/** Vercel Analytics custom events for the public funnel. */
export const FUNNEL = {
  toolUsed: 'tool-used',
  ctaClicked: 'cta-clicked',
  signupClick: 'signup-click',
  checkoutStarted: 'checkout-started',
} as const

/** Query param that carries the content page into signup and checkout. */
export const ORIGIN_QUERY = 'from'

/** Session key for the last public page, used when the query param is absent. */
export const ORIGIN_STORAGE_KEY = 'ds-origin-path'

const TRANSIENT_PATH = /^\/(?:auth|api|dashboard|store)(?:\/|$)/

/** Pathname only. Rejects open redirects, protocol-relative URLs, and oversized values. */
export function sanitizeOriginPath(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  let decoded = trimmed
  try {
    decoded = decodeURIComponent(trimmed)
  } catch {
    return null
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\') || decoded.includes('://')) {
    return null
  }
  try {
    const url = new URL(decoded, LOCAL_ORIGIN)
    if (url.origin !== LOCAL_ORIGIN) return null
    const path = url.pathname
    if (!path.startsWith('/') || path.startsWith('//') || path.length > 180 || path.includes('..')) return null
    return path
  } catch {
    return null
  }
}

/** Auth, API, dashboard, and storefront paths are not content origins. */
export function isTransientPath(path: string): boolean {
  return TRANSIENT_PATH.test(path)
}

/**
 * Prefer the content page that sent the visitor.
 * Query param, then the last public page, then the current pathname.
 */
export function resolveFunnelPath(input: {
  query?: string | null
  stored?: string | null
  current: string
}): string {
  const query = sanitizeOriginPath(input.query)
  if (query && !isTransientPath(query)) return query
  const stored = sanitizeOriginPath(input.stored)
  if (stored && !isTransientPath(stored)) return stored
  const current = sanitizeOriginPath(input.current)
  if (current) return current
  return '/'
}

/** Adds `from` to an internal href. Leaves external and hash-only hrefs unchanged. */
export function hrefWithOrigin(href: string, originPath: string): string {
  const origin = sanitizeOriginPath(originPath)
  if (!origin || !href.startsWith('/') || href.startsWith('//')) return href
  try {
    const url = new URL(href, LOCAL_ORIGIN)
    if (url.origin !== LOCAL_ORIGIN) return href
    if (!url.searchParams.has(ORIGIN_QUERY)) url.searchParams.set(ORIGIN_QUERY, origin)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return href
  }
}
