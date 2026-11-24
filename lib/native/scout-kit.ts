// lib/native/scout-kit.ts
// Offline Scout Kit data model shared by the bundled iOS app (native-app/) and
// the hosted dashboard when it runs inside the iOS app. Pure functions only:
// storage lives in scout-kit-storage.ts so this file is unit-testable.

import { parseProfitQuote, runProfitQuote, type ProfitQuoteFields } from '@/lib/marketing/profit-calculator'

export const SCOUT_KIT_VERSION = 1

export const STORAGE_KEYS = {
  watchlist: 'ds.kit.watchlist.v1',
  suppliers: 'ds.kit.suppliers.v1',
  calculator: 'ds.kit.calculator.v1',
  settings: 'ds.kit.settings.v1',
} as const

export const WATCH_STATUSES = ['idea', 'researching', 'testing', 'winner', 'dropped'] as const
export type WatchStatus = (typeof WATCH_STATUSES)[number]

export const SUPPLIER_PLATFORMS = ['CJ Dropshipping', 'Printful', 'Printify', 'AliExpress', 'Alibaba', 'Direct supplier', 'Other'] as const
export type SupplierPlatform = (typeof SUPPLIER_PLATFORMS)[number]

export interface WatchItem {
  id: string
  name: string
  category: string
  status: WatchStatus
  /** Price you plan to charge for the product (before shipping). */
  sellPrice: number | null
  /** Shipping you charge the customer. */
  shippingCharge: number | null
  supplierCost: number | null
  /** Shipping you pay the supplier. */
  shippingCost: number | null
  adCostPerOrder: number | null
  supplierId: string | null
  sourceUrl: string
  notes: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface SupplierNote {
  id: string
  name: string
  platform: SupplierPlatform
  contact: string
  url: string
  shippingDays: string
  moq: string
  /** 0 = not rated, 1-5 stars. */
  rating: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface KitSettings {
  appLock: boolean
  haptics: boolean
  reminder: { enabled: boolean; weekday: number; hour: number; minute: number }
  /** Card-fee defaults used by the calculator and watchlist margins. */
  paymentFeePercent: number
  paymentFeeFlat: number
  platformFeePercent: number
  returnsReservePercent: number
}

export const DEFAULT_SETTINGS: KitSettings = {
  appLock: false,
  haptics: true,
  // Monday 9:00 local time (weekday follows UNUserNotificationCenter: 1 = Sunday).
  reminder: { enabled: false, weekday: 2, hour: 9, minute: 0 },
  paymentFeePercent: 2.9,
  paymentFeeFlat: 0.3,
  platformFeePercent: 0,
  returnsReservePercent: 3,
}

export interface KitBackup {
  app: 'dropship-scout-kit'
  version: number
  exportedAt: string
  watchlist: WatchItem[]
  suppliers: SupplierNote[]
}

// ─── Parsing / normalizing (never trust stored or imported JSON) ─────────────

const MAX_TEXT = 4000
const MAX_ITEMS = 2000

function text(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function money(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return null
  return Math.round(n * 100) / 100
}

function isoDate(value: unknown, fallback: string): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : fallback
}

export function newId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeWatchItem(raw: unknown, now = new Date().toISOString()): WatchItem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = text(r.name, 140)
  if (!name) return null
  const status = WATCH_STATUSES.includes(r.status as WatchStatus) ? (r.status as WatchStatus) : 'idea'
  const tags = Array.isArray(r.tags) ? r.tags.map(t => text(t, 30)).filter(Boolean).slice(0, 12) : []
  const id = text(r.id, 64) || newId()
  return {
    id,
    name,
    category: text(r.category, 80),
    status,
    sellPrice: money(r.sellPrice),
    shippingCharge: money(r.shippingCharge),
    supplierCost: money(r.supplierCost),
    shippingCost: money(r.shippingCost),
    adCostPerOrder: money(r.adCostPerOrder),
    supplierId: text(r.supplierId, 64) || null,
    sourceUrl: safeUrl(r.sourceUrl),
    notes: text(r.notes, MAX_TEXT),
    tags,
    createdAt: isoDate(r.createdAt, now),
    updatedAt: isoDate(r.updatedAt, now),
  }
}

export function normalizeSupplier(raw: unknown, now = new Date().toISOString()): SupplierNote | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = text(r.name, 140)
  if (!name) return null
  const platform = SUPPLIER_PLATFORMS.includes(r.platform as SupplierPlatform) ? (r.platform as SupplierPlatform) : 'Other'
  const rating = typeof r.rating === 'number' && Number.isInteger(r.rating) && r.rating >= 0 && r.rating <= 5 ? r.rating : 0
  return {
    id: text(r.id, 64) || newId(),
    name,
    platform,
    contact: text(r.contact, 200),
    url: safeUrl(r.url),
    shippingDays: text(r.shippingDays, 40),
    moq: text(r.moq, 40),
    rating,
    notes: text(r.notes, MAX_TEXT),
    createdAt: isoDate(r.createdAt, now),
    updatedAt: isoDate(r.updatedAt, now),
  }
}

/** Only http(s) links are kept, so a stored note can never become a javascript: URL. */
export function safeUrl(value: unknown): string {
  const raw = text(value, 500)
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

export function parseList<T>(json: string | null | undefined, normalize: (raw: unknown) => T | null): T[] {
  if (!json) return []
  try {
    const data = JSON.parse(json)
    if (!Array.isArray(data)) return []
    return data.slice(0, MAX_ITEMS).map(item => normalize(item)).filter((x): x is T => x !== null)
  } catch {
    return []
  }
}

export function parseSettings(json: string | null | undefined): KitSettings {
  if (!json) return { ...DEFAULT_SETTINGS, reminder: { ...DEFAULT_SETTINGS.reminder } }
  try {
    const r = JSON.parse(json) as Partial<KitSettings>
    const rem: Partial<KitSettings['reminder']> = r.reminder && typeof r.reminder === 'object' ? r.reminder : {}
    const int = (v: unknown, min: number, max: number, d: number) => (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : d)
    const pct = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? v : d)
    return {
      appLock: r.appLock === true,
      haptics: r.haptics !== false,
      reminder: {
        enabled: rem.enabled === true,
        weekday: int(rem.weekday, 1, 7, DEFAULT_SETTINGS.reminder.weekday),
        hour: int(rem.hour, 0, 23, DEFAULT_SETTINGS.reminder.hour),
        minute: int(rem.minute, 0, 59, DEFAULT_SETTINGS.reminder.minute),
      },
      paymentFeePercent: pct(r.paymentFeePercent, DEFAULT_SETTINGS.paymentFeePercent),
      paymentFeeFlat: money(r.paymentFeeFlat) ?? DEFAULT_SETTINGS.paymentFeeFlat,
      platformFeePercent: pct(r.platformFeePercent, DEFAULT_SETTINGS.platformFeePercent),
      returnsReservePercent: pct(r.returnsReservePercent, DEFAULT_SETTINGS.returnsReservePercent),
    }
  } catch {
    return { ...DEFAULT_SETTINGS, reminder: { ...DEFAULT_SETTINGS.reminder } }
  }
}

export function upsert<T extends { id: string; updatedAt: string }>(list: T[], item: T): T[] {
  const index = list.findIndex(existing => existing.id === item.id)
  if (index === -1) return [item, ...list]
  const next = list.slice()
  next[index] = item
  return next
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter(item => item.id !== id)
}

// ─── Margin math (same engine as the web profit calculator) ─────────────────

export interface ItemMargin {
  customerTotal: number
  netProfitPerOrder: number
  netMarginPercent: number
  breakEvenCAC: number
  breakEvenROAS: number | null
  recommendation: 'stop' | 'review' | 'test'
}

function str(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}

export function itemToQuoteFields(item: Pick<WatchItem, 'sellPrice' | 'shippingCharge' | 'supplierCost' | 'shippingCost' | 'adCostPerOrder'>, settings: KitSettings): ProfitQuoteFields {
  return {
    productPrice: str(item.sellPrice),
    shippingCharge: str(item.shippingCharge),
    unitCost: str(item.supplierCost),
    shippingCost: str(item.shippingCost),
    paymentFeePercent: String(settings.paymentFeePercent),
    paymentFeeFlat: String(settings.paymentFeeFlat),
    platformFeePercent: String(settings.platformFeePercent),
    returnsReservePercent: String(settings.returnsReservePercent),
    adCostPerOrder: str(item.adCostPerOrder),
    testBudget: '',
    targetProfitPerOrder: '',
  }
}

/** Null when the item does not have a price and supplier cost yet. */
export function marginForItem(item: WatchItem, settings: KitSettings): ItemMargin | null {
  if (item.sellPrice === null || item.supplierCost === null) return null
  const quote = parseProfitQuote(itemToQuoteFields(item, settings))
  if ('error' in quote) return null
  const result = runProfitQuote(quote)
  if ('error' in result) return null
  const e = result.economics
  return {
    customerTotal: result.customerTotal,
    netProfitPerOrder: e.netProfitPerOrder,
    netMarginPercent: e.netMarginPercent,
    breakEvenCAC: e.breakEvenCAC,
    breakEvenROAS: e.breakEvenROAS,
    recommendation: e.recommendation,
  }
}

// ─── Exports (Share Sheet) ──────────────────────────────────────────────────

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value)
  // Neutralize spreadsheet formulas (CSV injection).
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const WATCHLIST_CSV_HEADER = [
  'Name', 'Status', 'Category', 'Sell price', 'Shipping charged', 'Supplier cost', 'Shipping paid',
  'Ad cost per sale', 'Net per order', 'Net margin %', 'Break-even CAC', 'Supplier', 'Source URL', 'Tags', 'Notes', 'Updated',
]

export function watchlistCsv(items: WatchItem[], suppliers: SupplierNote[], settings: KitSettings): string {
  const supplierName = new Map(suppliers.map(s => [s.id, s.name]))
  const rows = items.map(item => {
    const m = marginForItem(item, settings)
    return [
      item.name, item.status, item.category, item.sellPrice, item.shippingCharge, item.supplierCost, item.shippingCost,
      item.adCostPerOrder, m ? m.netProfitPerOrder.toFixed(2) : '', m ? m.netMarginPercent.toFixed(1) : '',
      m ? m.breakEvenCAC.toFixed(2) : '', item.supplierId ? supplierName.get(item.supplierId) ?? '' : '',
      item.sourceUrl, item.tags.join(' '), item.notes, item.updatedAt,
    ].map(csvCell).join(',')
  })
  return [WATCHLIST_CSV_HEADER.map(csvCell).join(','), ...rows].join('\r\n') + '\r\n'
}

export function researchCard(item: WatchItem, settings: KitSettings, supplier?: SupplierNote | null): string {
  const m = marginForItem(item, settings)
  const lines = [
    `Product research card: ${item.name}`,
    `Status: ${item.status}${item.category ? ` · ${item.category}` : ''}`,
    '',
    `Sell price: ${formatUsd(item.sellPrice)} + shipping ${formatUsd(item.shippingCharge ?? 0)}`,
    `Supplier cost: ${formatUsd(item.supplierCost)} + shipping ${formatUsd(item.shippingCost ?? 0)}`,
    `Ad cost per sale: ${formatUsd(item.adCostPerOrder ?? 0)}`,
  ]
  if (m) {
    lines.push(
      `Net per order after fees and ads: ${formatUsd(m.netProfitPerOrder)} (${m.netMarginPercent.toFixed(1)}% margin)`,
      `Break-even cost per acquisition: ${formatUsd(m.breakEvenCAC)}`,
      `Break-even ROAS: ${m.breakEvenROAS === null ? 'none (no money left before ads)' : `${m.breakEvenROAS.toFixed(2)}x`}`,
    )
  } else {
    lines.push('Margin: add a sell price and supplier cost to calculate.')
  }
  lines.push(`Fees assumed: card ${settings.paymentFeePercent}% + ${formatUsd(settings.paymentFeeFlat)}, platform ${settings.platformFeePercent}%, refund reserve ${settings.returnsReservePercent}%`)
  if (supplier) lines.push('', `Supplier: ${supplier.name} (${supplier.platform})${supplier.shippingDays ? ` · ships in ${supplier.shippingDays}` : ''}`)
  if (item.sourceUrl) lines.push(`Source: ${item.sourceUrl}`)
  if (item.tags.length) lines.push(`Tags: ${item.tags.join(', ')}`)
  if (item.notes) lines.push('', 'Notes:', item.notes)
  lines.push('', 'Scenario math from the numbers entered, not a sales forecast. Made with Dropship Scout.')
  return lines.join('\n')
}

export function supplierBrief(supplier: SupplierNote, items: WatchItem[]): string {
  const linked = items.filter(item => item.supplierId === supplier.id)
  const lines = [
    `Supplier brief: ${supplier.name}`,
    `Platform: ${supplier.platform}`,
  ]
  if (supplier.rating) lines.push(`Rating: ${'★'.repeat(supplier.rating)}${'☆'.repeat(5 - supplier.rating)}`)
  if (supplier.shippingDays) lines.push(`Shipping time: ${supplier.shippingDays}`)
  if (supplier.moq) lines.push(`Minimum order: ${supplier.moq}`)
  if (supplier.contact) lines.push(`Contact: ${supplier.contact}`)
  if (supplier.url) lines.push(`Link: ${supplier.url}`)
  if (linked.length) {
    lines.push('', 'Products on my watchlist from this supplier:')
    for (const item of linked) lines.push(`• ${item.name} — cost ${formatUsd(item.supplierCost)}, sell ${formatUsd(item.sellPrice)}`)
  }
  if (supplier.notes) lines.push('', 'Notes:', supplier.notes)
  lines.push('', 'Made with Dropship Scout.')
  return lines.join('\n')
}

export function makeBackup(watchlist: WatchItem[], suppliers: SupplierNote[], now = new Date()): KitBackup {
  return { app: 'dropship-scout-kit', version: SCOUT_KIT_VERSION, exportedAt: now.toISOString(), watchlist, suppliers }
}

/** Parses a backup file. Returns null when the file is not a Scout Kit backup. */
export function parseBackup(json: string): { watchlist: WatchItem[]; suppliers: SupplierNote[] } | null {
  try {
    const data = JSON.parse(json) as Partial<KitBackup>
    if (data.app !== 'dropship-scout-kit' || !Array.isArray(data.watchlist) || !Array.isArray(data.suppliers)) return null
    return {
      watchlist: parseList(JSON.stringify(data.watchlist), normalizeWatchItem),
      suppliers: parseList(JSON.stringify(data.suppliers), normalizeSupplier),
    }
  } catch {
    return null
  }
}

/** Merge imported records into existing ones; newer updatedAt wins per id. */
export function mergeById<T extends { id: string; updatedAt: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map(existing.map(item => [item.id, item]))
  for (const item of incoming) {
    const current = map.get(item.id)
    if (!current || Date.parse(item.updatedAt) >= Date.parse(current.updatedAt)) map.set(item.id, item)
  }
  return Array.from(map.values()).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

/** Weekly reminder copy. Never includes product names or numbers on the lock screen. */
export const REMINDER = {
  id: 7101,
  title: 'Weekly product scout',
  body: 'Review your watchlist, update supplier quotes, and re-check margins before you spend on ads.',
} as const
