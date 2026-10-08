import { guideBySlug } from '@/lib/marketing/content'
import { marketingOg, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og-card'

export const runtime = 'edge'
export const alt = 'Dropship Scout guide'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpenGraphImage({ params }: { params: { slug: string } }) {
  const guide = guideBySlug(params.slug)
  return marketingOg(guide?.title ?? 'Dropshipping guide', 'Guides')
}
