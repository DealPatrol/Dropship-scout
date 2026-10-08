export interface AccountAttribution {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
  gclid: string | null
  fbclid: string | null
  landingPath: string | null
}

const EMPTY: AccountAttribution = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmTerm: null,
  utmContent: null,
  gclid: null,
  fbclid: null,
  landingPath: null,
}

function clip(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/[\r\n\t]/g, '')
  if (!trimmed) return null
  return trimmed.slice(0, 120)
}

function landingPath(value: unknown): string | null {
  const path = clip(value)
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null
  return path
}

export function attributionFromUnknown(value: unknown): AccountAttribution | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const attribution: AccountAttribution = {
    utmSource: clip(record.utmSource ?? record.utm_source),
    utmMedium: clip(record.utmMedium ?? record.utm_medium),
    utmCampaign: clip(record.utmCampaign ?? record.utm_campaign),
    utmTerm: clip(record.utmTerm ?? record.utm_term),
    utmContent: clip(record.utmContent ?? record.utm_content),
    gclid: clip(record.gclid),
    fbclid: clip(record.fbclid),
    landingPath: landingPath(record.landingPath ?? record.landing_path),
  }
  const useful = Object.values(attribution).some(item => item !== null)
  return useful ? attribution : null
}

export function attributionFromSearch(params: URLSearchParams, landing?: string): AccountAttribution | null {
  return attributionFromUnknown({
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
    gclid: params.get('gclid'),
    fbclid: params.get('fbclid'),
    landingPath: landing,
  })
}

export function attributionFromCookieValue(raw: string | undefined): AccountAttribution | null {
  if (!raw) return null
  const candidates = [raw]
  try {
    candidates.push(decodeURIComponent(raw))
  } catch {
    // The cookie may already be decoded.
  }
  for (const candidate of candidates) {
    try {
      const parsed = attributionFromUnknown(JSON.parse(candidate))
      if (parsed) return parsed
    } catch {
      // Try the next encoding.
    }
  }
  return null
}

export function mergeAttribution(current: AccountAttribution | null, incoming: AccountAttribution | null): AccountAttribution | null {
  if (!incoming) return current
  if (!current) return incoming
  return {
    utmSource: incoming.utmSource ?? current.utmSource,
    utmMedium: incoming.utmMedium ?? current.utmMedium,
    utmCampaign: incoming.utmCampaign ?? current.utmCampaign,
    utmTerm: incoming.utmTerm ?? current.utmTerm,
    utmContent: incoming.utmContent ?? current.utmContent,
    gclid: incoming.gclid ?? current.gclid,
    fbclid: incoming.fbclid ?? current.fbclid,
    landingPath: incoming.landingPath ?? current.landingPath,
  }
}

export function attributionCookieName(): string {
  return 'ds_attr'
}

export function currentPageAttribution(): AccountAttribution | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const landing = `${window.location.pathname}${window.location.search}`.slice(0, 120)
  const fromUrl = attributionFromSearch(params, landing)
  const raw = document.cookie
    .split('; ')
    .map(part => {
      const index = part.indexOf('=')
      if (index === -1) return null
      return [part.slice(0, index), part.slice(index + 1)] as const
    })
    .find(part => part?.[0] === attributionCookieName())
  return mergeAttribution(attributionFromCookieValue(raw?.[1]), fromUrl)
}

export { EMPTY as emptyAttribution }
