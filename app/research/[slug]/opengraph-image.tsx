import { intentBySlug } from '@/lib/marketing/intent'
import { marketingOg, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og-card'

export const runtime = 'edge'
export const alt = 'Dropship Scout research'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpenGraphImage({ params }: { params: { slug: string } }) {
  const page = intentBySlug(params.slug)
  return marketingOg(page?.title ?? 'Product research', 'Research')
}
