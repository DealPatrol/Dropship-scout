import type { MetadataRoute } from 'next'
import { marketingPaths } from '@/lib/marketing/paths'
import { sitemapLastModified } from '@/lib/marketing/sitemap-dates'
import { absoluteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return marketingPaths(new Date()).map(entry => ({
    url: absoluteUrl(entry.path),
    lastModified: sitemapLastModified(entry.path),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
