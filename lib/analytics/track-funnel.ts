import { track } from '@vercel/analytics'
import { FUNNEL, ORIGIN_QUERY, ORIGIN_STORAGE_KEY, isTransientPath, resolveFunnelPath, sanitizeOriginPath } from '@/lib/analytics/origin'

export { FUNNEL }

export function rememberOrigin(path: string): void {
  const safe = sanitizeOriginPath(path)
  if (!safe || isTransientPath(safe) || typeof window === 'undefined') return
  try {
    sessionStorage.setItem(ORIGIN_STORAGE_KEY, safe)
  } catch {
    // Private mode can reject sessionStorage. The query param still carries the path.
  }
}

/** Content path to attach to signup and checkout events. */
export function funnelPath(queryFrom?: string | null): string {
  if (typeof window === 'undefined') return '/'
  let stored: string | null = null
  try {
    stored = sessionStorage.getItem(ORIGIN_STORAGE_KEY)
  } catch {
    stored = null
  }
  const query = queryFrom === undefined
    ? new URLSearchParams(window.location.search).get(ORIGIN_QUERY)
    : queryFrom
  return resolveFunnelPath({
    query,
    stored,
    current: window.location.pathname,
  })
}

export function trackFunnel(
  event: string,
  props: Record<string, string | number | boolean>,
): void {
  try {
    track(event, props)
  } catch {
    // Analytics must not block the page, signup, or checkout.
  }
}
