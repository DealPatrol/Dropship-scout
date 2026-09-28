import type { MetadataRoute } from 'next'
import { GUIDES } from '@/lib/marketing/content'
import { siteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staticPaths = ['', '/pricing', '/faq', '/guides']
  return [
    ...staticPaths.map(path => ({
      url: `${siteUrl()}${path || '/'}`,
      lastModified: now,
      changeFrequency: path === '' ? 'weekly' as const : 'monthly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...GUIDES.map(guide => ({
      url: `${siteUrl()}/guides/${guide.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
