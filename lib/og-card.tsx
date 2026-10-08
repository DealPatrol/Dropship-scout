import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

export function marketingOg(title: string, kicker = 'Dropship Scout') {
  const fontSize = title.length > 42 ? 52 : 64
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0f172a',
          color: '#f8fafc',
          padding: 72,
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: '#93c5fd' }}>{kicker}</div>
        <div style={{ display: 'flex', fontSize, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: 'flex', fontSize: 24, color: '#cbd5e1' }}>Product research for people choosing what to sell</div>
      </div>
    ),
    OG_SIZE,
  )
}
