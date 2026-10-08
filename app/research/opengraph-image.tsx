import { marketingOg, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og-card'

export const runtime = 'edge'
export const alt = 'Dropshipping product research'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpenGraphImage() {
  return marketingOg('Dropshipping product research', 'Research')
}
