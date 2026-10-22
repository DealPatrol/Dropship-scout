import { marketingOg, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og-card'

export const runtime = 'edge'
export const alt = 'Free dropshipping supplier comparison'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpenGraphImage() {
  return marketingOg('Supplier comparison', 'Free tool')
}
