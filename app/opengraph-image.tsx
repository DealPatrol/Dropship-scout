import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Dropship Scout hosted storefront'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        padding: 80,
      }}>
        <div style={{ fontSize: 28, color: '#93c5fd' }}>Dropship Scout</div>
        <div style={{ fontSize: 68, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>
          Sell supplier products on a hosted storefront
        </div>
      </div>
    ),
    size
  )
}
