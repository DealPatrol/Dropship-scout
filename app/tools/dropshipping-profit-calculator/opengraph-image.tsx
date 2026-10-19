import { marketingOg, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og-card'

export const runtime = 'edge'
export const alt = 'Free dropshipping profit calculator'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpenGraphImage() {
  return marketingOg('Profit margin calculator', 'Free tool')
}
