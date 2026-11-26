import { CONTENT_DATE } from '@/lib/seo'

/**
 * lastModified used to be new Date() on every request, which tells crawlers
 * every page changed on every fetch. Use a stable content date instead, and a
 * newer one for pages changed after it.
 */
const PAGE_UPDATED: Record<string, string> = {
  '/': '2026-11-26',
  '/tools/black-friday-discount-calculator': '2026-11-26',
  '/tools/dropshipping-profit-calculator': '2026-11-26',
  '/guides/autods-vs-dropship-scout': '2026-11-24',
  '/guides/zik-analytics-vs-dropship-scout': '2026-11-24',
}

export function sitemapLastModified(path: string): Date {
  return new Date(`${PAGE_UPDATED[path] ?? CONTENT_DATE}T12:00:00Z`)
}
