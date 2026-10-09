/**
 * Google Search Console HTML-tag verification.
 * Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION (or GOOGLE_SITE_VERIFICATION) in Vercel to the token from
 * Search Console ("HTML tag" method). Accepts the bare token or the full meta tag.
 */
export function googleSiteVerificationToken(
  raw = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION,
): string | null {
  const value = raw?.trim()
  if (!value) return null
  const fromTag = value.match(/content=["']([^"']+)["']/i)
  const token = (fromTag ? fromTag[1] : value).trim()
  return /^[A-Za-z0-9_-]{10,}$/.test(token) ? token : null
}
