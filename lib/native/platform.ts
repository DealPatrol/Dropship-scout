// lib/native/platform.ts
// Detects the Dropship Scout iOS app (Capacitor 8). Safe to import on the
// server and in the edge middleware: it never touches Capacitor at import time.

/** Appended to the WKWebView user agent by capacitor.config.ts (ios.appendUserAgent). */
export const NATIVE_IOS_UA_TOKEN = 'DropshipScoutiOS'

export const IOS_BUNDLE_ID = 'com.colecollins.dropshipscout'
export const IOS_URL_SCHEME = 'dropshipscout'

/** Hosted workspace that the iOS app signs in to (allowNavigation in capacitor.config.ts). */
export const WORKSPACE_ORIGIN = 'https://getdropshipscout.com'

/** Bundled offline Scout Kit served by Capacitor from the app binary. */
export const SCOUT_KIT_ORIGIN = 'capacitor://localhost'

export const IOS_PRO_PRODUCT_IDS = {
  month: 'com.colecollins.dropshipscout.pro.monthly',
  year: 'com.colecollins.dropshipscout.pro.yearly',
} as const

export type IosProProductId = (typeof IOS_PRO_PRODUCT_IDS)[keyof typeof IOS_PRO_PRODUCT_IDS]

export function isIosProProductId(value: unknown): value is IosProProductId {
  return value === IOS_PRO_PRODUCT_IDS.month || value === IOS_PRO_PRODUCT_IDS.year
}

/** True when a request or page comes from the iOS app's web view. */
export function isNativeIosUserAgent(userAgent: string | null | undefined): boolean {
  return typeof userAgent === 'string' && userAgent.includes(`${NATIVE_IOS_UA_TOKEN}/`)
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
}

/**
 * True only inside the native iOS app. Used to hide Stripe checkout, external
 * billing links and web-only banners (App Review Guideline 3.1.1).
 */
export function isNativeIos(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor
  if (cap?.isNativePlatform?.() && cap.getPlatform?.() === 'ios') return true
  return isNativeIosUserAgent(typeof navigator === 'undefined' ? null : navigator.userAgent)
}

/** Maps a dropshipscout:// deep link to where the app should go. */
export type DeepLinkTarget =
  | { kind: 'kit'; route: ScoutKitRoute; id?: string }
  | { kind: 'workspace'; path: string }

export const SCOUT_KIT_ROUTES = ['watchlist', 'calculator', 'suppliers', 'workspace', 'settings'] as const
export type ScoutKitRoute = (typeof SCOUT_KIT_ROUTES)[number]

export function isScoutKitRoute(value: string): value is ScoutKitRoute {
  return (SCOUT_KIT_ROUTES as readonly string[]).includes(value)
}

const WORKSPACE_PATHS = /^\/(dashboard(\/[a-z0-9\-/]*)?|auth\/(login|sign-up)|privacy|terms|contact|faq|guides(\/[a-z0-9-]+)?)$/

/**
 * dropshipscout://watchlist, dropshipscout://calculator, dropshipscout://suppliers,
 * dropshipscout://watchlist/<id>, dropshipscout://dashboard/launch, ...
 * https://getdropshipscout.com/dashboard/... links also map to the workspace.
 * Anything unknown opens the watchlist rather than an arbitrary URL.
 */
export function parseDeepLink(raw: string): DeepLinkTarget {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { kind: 'kit', route: 'watchlist' }
  }
  let segments: string[]
  if (url.protocol === `${IOS_URL_SCHEME}:`) {
    // dropshipscout://watchlist/abc -> host "watchlist", pathname "/abc"
    segments = [url.hostname, ...url.pathname.split('/')].filter(Boolean)
  } else if (url.origin === WORKSPACE_ORIGIN) {
    segments = url.pathname.split('/').filter(Boolean)
  } else {
    return { kind: 'kit', route: 'watchlist' }
  }
  const [first = 'watchlist', second] = segments.map(s => s.toLowerCase())
  if (isScoutKitRoute(first)) {
    return second && /^[a-z0-9-]{1,64}$/.test(second) ? { kind: 'kit', route: first, id: second } : { kind: 'kit', route: first }
  }
  const path = `/${segments.join('/')}`.toLowerCase()
  if (WORKSPACE_PATHS.test(path)) return { kind: 'workspace', path }
  return { kind: 'kit', route: 'watchlist' }
}

export function scoutKitUrl(route: ScoutKitRoute = 'watchlist', id?: string): string {
  return `${SCOUT_KIT_ORIGIN}/#/${route}${id ? `/${id}` : ''}`
}
