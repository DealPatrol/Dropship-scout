import type { MetadataRoute } from 'next'
import { marketingPaths } from '@/lib/marketing/paths'
import { absoluteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return marketingPaths(now).map(entry => ({
    url: absoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
