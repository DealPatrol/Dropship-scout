import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/research', '/pricing', '/faq', '/guides'],
      disallow: ['/dashboard', '/api/', '/auth/', '/store/*/cart', '/store/*/checkout', '/store/*/orders'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
