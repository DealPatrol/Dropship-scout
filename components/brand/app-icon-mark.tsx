import { type ReactElement } from 'react'

const RADAR_PATHS = [
  'M19.07 4.93A10 10 0 0 0 6.99 3.34',
  'M4 6h.01',
  'M2.29 9.62A10 10 0 1 0 21.31 8.35',
  'M16.24 7.76A6 6 0 1 0 8.23 16.67',
  'M12 18h.01',
  'M17.99 11.66A6 6 0 0 1 15.77 16.67',
  'm13.41 10.59 5.66-5.66',
]

/** Blue rounded square with the white Radar mark used in the site header. */
export function AppIconMark({ size }: { size: number }): ReactElement {
  const icon = Math.round(size * 0.62)
  const stroke = {
    stroke: 'white',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#426eff',
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
        {RADAR_PATHS.map(d => (
          <path key={d} d={d} {...stroke} />
        ))}
        <circle cx="12" cy="12" r="2" {...stroke} />
      </svg>
    </div>
  )
}
