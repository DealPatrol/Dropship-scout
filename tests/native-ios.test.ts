import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  IOS_PRO_PRODUCT_IDS,
  NATIVE_IOS_UA_TOKEN,
  isIosProProductId,
  isNativeIos,
  isNativeIosUserAgent,
  parseDeepLink,
  scoutKitUrl,
} from '@/lib/native/platform'
import {
  DEFAULT_SETTINGS,
  makeBackup,
  marginForItem,
  mergeById,
  normalizeSupplier,
  normalizeWatchItem,
  parseBackup,
  parseList,
  parseSettings,
  researchCard,
  safeUrl,
  supplierBrief,
  watchlistCsv,
  type WatchItem,
} from '@/lib/native/scout-kit'

const read = (file: string) => readFileSync(file, 'utf8')

describe('native iOS detection', () => {
  it('matches the user agent token appended by capacitor.config.ts', () => {
    expect(read('capacitor.config.ts')).toContain(`appendUserAgent: '${NATIVE_IOS_UA_TOKEN}/1.0'`)
    expect(isNativeIosUserAgent(`Mozilla/5.0 (iPhone) AppleWebKit/605 Mobile/15E148 ${NATIVE_IOS_UA_TOKEN}/1.0`)).toBe(true)
    expect(isNativeIosUserAgent('Mozilla/5.0 (iPhone) Safari/604.1')).toBe(false)
    expect(isNativeIosUserAgent(null)).toBe(false)
  })

  it('is false on the server', () => {
    expect(isNativeIos()).toBe(false)
  })

  it('knows only the two Pro subscription products', () => {
    expect(isIosProProductId(IOS_PRO_PRODUCT_IDS.month)).toBe(true)
    expect(isIosProProductId(IOS_PRO_PRODUCT_IDS.year)).toBe(true)
    expect(isIosProProductId('com.colecollins.dropshipscout.pro')).toBe(false)
    const storekit = JSON.parse(read('ios/App/App/DropshipScout.storekit'))
    const ids = storekit.subscriptionGroups[0].subscriptions.map((s: { productID: string }) => s.productID).sort()
    expect(ids).toEqual([IOS_PRO_PRODUCT_IDS.month, IOS_PRO_PRODUCT_IDS.year].sort())
  })
})

describe('deep links', () => {
  it('routes Scout Kit tabs and item ids', () => {
    expect(parseDeepLink('dropshipscout://watchlist')).toEqual({ kind: 'kit', route: 'watchlist' })
    expect(parseDeepLink('dropshipscout://calculator')).toEqual({ kind: 'kit', route: 'calculator' })
    expect(parseDeepLink('dropshipscout://suppliers/abc-123')).toEqual({ kind: 'kit', route: 'suppliers', id: 'abc-123' })
  })

  it('routes known workspace paths', () => {
    expect(parseDeepLink('dropshipscout://dashboard/launch')).toEqual({ kind: 'workspace', path: '/dashboard/launch' })
    expect(parseDeepLink('https://getdropshipscout.com/dashboard/settings')).toEqual({ kind: 'workspace', path: '/dashboard/settings' })
  })

  it('never routes to arbitrary or foreign URLs', () => {
    expect(parseDeepLink('https://evil.example/dashboard')).toEqual({ kind: 'kit', route: 'watchlist' })
    expect(parseDeepLink('dropshipscout://api/account/delete')).toEqual({ kind: 'kit', route: 'watchlist' })
    expect(parseDeepLink('javascript:alert(1)')).toEqual({ kind: 'kit', route: 'watchlist' })
    expect(parseDeepLink('not a url')).toEqual({ kind: 'kit', route: 'watchlist' })
  })

  it('builds bundled Scout Kit URLs', () => {
    expect(scoutKitUrl('settings')).toBe('capacitor://localhost/#/settings')
  })
})

const item = (overrides: Partial<WatchItem> = {}): WatchItem => normalizeWatchItem({
  id: 'p1', name: 'Magnetic phone mount', category: 'Car', status: 'testing',
  sellPrice: 24.99, supplierCost: 6.4, shippingCost: 3.1, adCostPerOrder: 7, tags: ['gift'],
  createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-02T00:00:00.000Z', ...overrides,
}) as WatchItem

describe('Scout Kit data', () => {
  it('normalizes untrusted records', () => {
    expect(normalizeWatchItem({ name: '' })).toBeNull()
    expect(normalizeWatchItem(null)).toBeNull()
    const n = normalizeWatchItem({ name: '  Lamp ', status: 'bogus', sellPrice: '-3', supplierCost: 'abc', sourceUrl: 'javascript:alert(1)' })
    expect(n).toMatchObject({ name: 'Lamp', status: 'idea', sellPrice: null, supplierCost: null, sourceUrl: '' })
    expect(normalizeSupplier({ name: 'CJ agent', rating: 9, platform: 'x' })).toMatchObject({ rating: 0, platform: 'Other' })
    expect(safeUrl('https://cjdropshipping.com/p/1')).toBe('https://cjdropshipping.com/p/1')
    expect(parseList('{bad json', normalizeWatchItem)).toEqual([])
  })

  it('computes margins with the same engine as the web calculator', () => {
    const m = marginForItem(item(), DEFAULT_SETTINGS)
    expect(m).not.toBeNull()
    expect(m!.netProfitPerOrder).toBeCloseTo(6.72, 1)
    expect(marginForItem(item({ sellPrice: null }), DEFAULT_SETTINGS)).toBeNull()
  })

  it('exports CSV with formula injection neutralized', () => {
    const csv = watchlistCsv([item({ name: '=HYPERLINK("x")', notes: 'line1\nline2' })], [], DEFAULT_SETTINGS)
    const [header, row] = csv.split('\r\n')
    expect(header.startsWith('Name,Status')).toBe(true)
    expect(row.startsWith(`"'=HYPERLINK(""x"")"`)).toBe(true)
  })

  it('builds share text for research cards and supplier briefs', () => {
    const supplier = normalizeSupplier({ id: 's1', name: 'Shenzhen Mounts', platform: 'CJ Dropshipping', rating: 4, shippingDays: '7-12 days' })!
    const card = researchCard(item({ supplierId: 's1' }), DEFAULT_SETTINGS, supplier)
    expect(card).toContain('Product research card: Magnetic phone mount')
    expect(card).toContain('Shenzhen Mounts')
    expect(card).toContain('not a sales forecast')
    expect(supplierBrief(supplier, [item({ supplierId: 's1' })])).toContain('Magnetic phone mount')
  })

  it('round-trips backups and merges by newest update', () => {
    const backup = JSON.stringify(makeBackup([item()], [], new Date('2026-11-03')))
    expect(parseBackup(backup)?.watchlist).toHaveLength(1)
    expect(parseBackup('{"app":"other"}')).toBeNull()
    const older = item({ name: 'Old', updatedAt: '2026-10-01T00:00:00.000Z' })
    const newer = item({ name: 'New', updatedAt: '2026-11-05T00:00:00.000Z' })
    expect(mergeById([newer], [older])[0].name).toBe('New')
    expect(mergeById([older], [newer])[0].name).toBe('New')
  })

  it('parses settings defensively', () => {
    expect(parseSettings('nope')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings(JSON.stringify({ appLock: true, reminder: { enabled: true, weekday: 9, hour: 8 } }))).toMatchObject({
      appLock: true, reminder: { enabled: true, weekday: DEFAULT_SETTINGS.reminder.weekday, hour: 8, minute: 0 },
    })
  })
})

describe('App Review guardrails in source', () => {
  it('never starts from a remote server URL', () => {
    const config = read('capacitor.config.ts')
    expect(config).toContain("webDir: 'native-app/dist'")
    expect(config).not.toMatch(/\burl:\s*'/)
  })

  it('blocks Stripe checkout and portal for the iOS app', () => {
    for (const file of ['app/api/billing/checkout/route.ts', 'app/api/billing/portal/route.ts']) {
      expect(read(file)).toContain('isNativeIosUserAgent')
    }
    expect(read('middleware.ts')).toContain('nativeIosRedirect')
    expect(read('components/dashboard/settings-view.tsx')).toContain('AppStoreProPanel')
    expect(read('components/marketing/checkout-button.tsx')).toContain('isNativeIos')
  })

  it('offers in-app account deletion', () => {
    expect(read('components/dashboard/settings-view.tsx')).toContain('<DeleteAccountCard />')
    expect(read('app/api/account/delete/route.ts')).toContain('deleteAccount')
  })

  it('declares encryption, Face ID and the URL scheme in Info.plist', () => {
    const plist = read('ios/App/App/Info.plist')
    expect(plist).toMatch(/ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/)
    expect(plist).toContain('NSFaceIDUsageDescription')
    expect(plist).toContain('<string>dropshipscout</string>')
  })

  it('keeps ad pixels out of the iOS app', () => {
    expect(read('app/layout.tsx')).toMatch(/<WebOnlyScripts>\s*<AdsTags \/>/)
  })
})
