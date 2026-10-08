import { GUIDES } from '@/lib/marketing/content'
import { allIntentPages } from '@/lib/marketing/intent'
import { seasonForDate } from '@/lib/marketing/public-catalog'

export interface MarketingPath {
  path: string
  priority: number
  changeFrequency: 'weekly' | 'monthly'
}

export function marketingPaths(now = new Date()): MarketingPath[] {
  const season = seasonForDate(now)
  const staticPaths: MarketingPath[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/research', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/research/preview', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/research/idea-checker', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/guides', priority: 0.6, changeFrequency: 'monthly' },
  ]
  const research = allIntentPages().map(page => ({
    path: `/research/${page.slug}`,
    priority: page.season === season ? 0.85 : 0.7,
    changeFrequency: 'monthly' as const,
  }))
  const guides = GUIDES.map(guide => ({
    path: `/guides/${guide.slug}`,
    priority: 0.55,
    changeFrequency: 'monthly' as const,
  }))
  return [...staticPaths, ...research, ...guides]
}
