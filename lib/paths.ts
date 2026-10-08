const LOCAL_ORIGIN = 'https://dropshipscout.local'

/** Same-origin path for post-login redirects. Rejects open redirects. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return null
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\') || decoded.includes('://')) {
    return null
  }
  try {
    const url = new URL(decoded, LOCAL_ORIGIN)
    if (url.origin !== LOCAL_ORIGIN) return null
    if (!url.pathname.startsWith('/') || url.pathname.startsWith('//')) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
