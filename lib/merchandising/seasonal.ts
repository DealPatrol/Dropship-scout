// lib/merchandising/seasonal.ts
// "When to Sell" engine: demand curves, timing filters, stock-by dates,
// and month-aware recommendations.

import { HOLIDAY_MAP, HOLIDAYS } from './data'
import type {
  CatalogProduct,
  DemandLevel,
  Season,
  SeasonalAlert,
  TimingFilterId,
} from './types'

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const SEASON_MONTHS: Record<Season, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  fall: [9, 10, 11],
  winter: [12, 1, 2],
}

export const SEASON_LABELS: Record<Season, { label: string; emoji: string }> = {
  spring: { label: 'Spring', emoji: '🌸' },
  summer: { label: 'Summer', emoji: '☀️' },
  fall: { label: 'Fall', emoji: '🍂' },
  winter: { label: 'Winter', emoji: '❄️' },
}

export const TIMING_FILTERS: { id: TimingFilterId; label: string; emoji: string }[] = [
  { id: 'this_month', label: 'Trending This Month', emoji: '🔥' },
  { id: 'next_3_months', label: 'Next 3 Months', emoji: '📈' },
  { id: 'spring', label: 'Spring Winners', emoji: '🌸' },
  { id: 'summer', label: 'Summer Winners', emoji: '☀️' },
  { id: 'fall', label: 'Fall Winners', emoji: '🍂' },
  { id: 'winter', label: 'Winter Winners', emoji: '❄️' },
  ...HOLIDAYS.map(h => ({ id: h.id as TimingFilterId, label: h.label, emoji: h.emoji })),
]

function wrapMonth(m: number): number {
  return ((m - 1 + 12) % 12) + 1
}

/**
 * Demand level for a product in a given month (1-12).
 * Peak months are 3, shoulder months (adjacent to a peak) are 2.
 */
export function demandForMonth(product: CatalogProduct, month: number): DemandLevel {
  if (product.peakMonths.includes(month)) return 3
  if (product.seasonality === 'evergreen') return 2
  if (product.holidays.some(h => HOLIDAY_MAP[h].month === month)) return 2
  const shoulder = product.peakMonths.some(
    peak => wrapMonth(peak - 1) === month || wrapMonth(peak + 1) === month
  )
  return shoulder ? 1 : 0
}

export function demandGlyph(level: DemandLevel): string {
  switch (level) {
    case 3:
      return '★'
    case 2:
      return '✔'
    case 1:
      return '△'
    case 0:
      return '○'
    default: {
      const _exhaustive: never = level
      return _exhaustive
    }
  }
}

/** Peak month (1-12) for a seasonal product, or null for flat evergreen. */
export function peakMonth(product: CatalogProduct): number | null {
  if (product.peakMonths.length === 0) return null
  const mid = Math.floor(product.peakMonths.length / 2)
  return product.peakMonths[mid]
}

/** Month merchants should have inventory ready by (~2 months before the window opens). */
export function stockByMonth(product: CatalogProduct): number | null {
  if (product.peakMonths.length === 0) return null
  return wrapMonth(product.peakMonths[0] - 2)
}

export function sellingWindowLabel(product: CatalogProduct): string {
  if (product.peakMonths.length === 0) return 'Year-round'
  const first = product.peakMonths[0]
  const last = product.peakMonths[product.peakMonths.length - 1]
  return `${MONTH_LABELS[first - 1]}–${MONTH_LABELS[last - 1]}`
}

export function matchesTimingFilter(
  product: CatalogProduct,
  filter: TimingFilterId,
  now: Date = new Date()
): boolean {
  const month = now.getMonth() + 1
  switch (filter) {
    case 'this_month':
      return demandForMonth(product, month) >= 2 && (product.trend === 'hot' || product.trend === 'rising' || product.peakMonths.includes(month))
    case 'next_3_months':
      return [1, 2, 3].some(offset => demandForMonth(product, wrapMonth(month + offset)) === 3) ||
        (product.seasonality === 'evergreen' && (product.trend === 'hot' || product.trend === 'rising'))
    case 'spring':
    case 'summer':
    case 'fall':
    case 'winter':
      return SEASON_MONTHS[filter].some(m => product.peakMonths.includes(m))
    case 'valentines':
    case 'easter':
    case 'mothers_day':
    case 'fathers_day':
    case 'july4':
    case 'back_to_school':
    case 'halloween':
    case 'thanksgiving':
    case 'black_friday':
    case 'christmas':
      return product.holidays.includes(filter)
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

/**
 * Month-aware stocking recommendations: products whose selling window opens
 * within the supplier lead time (~2 months), so merchants stock before demand.
 */
export function stockingAlerts(products: CatalogProduct[], now: Date = new Date()): SeasonalAlert[] {
  const month = now.getMonth() + 1
  const alerts: SeasonalAlert[] = []

  for (const product of products) {
    const stockBy = stockByMonth(product)
    if (stockBy === null) continue
    const monthsUntilStock = (stockBy - month + 12) % 12
    if (monthsUntilStock === 0) {
      alerts.push({
        productId: product.id,
        message: `Stock ${product.name} now — its selling window (${sellingWindowLabel(product)}) opens soon.`,
        urgency: 'now',
      })
    } else if (monthsUntilStock === 1) {
      alerts.push({
        productId: product.id,
        message: `Prepare ${product.name} — order inventory by ${MONTH_LABELS[stockBy - 1]} to catch ${sellingWindowLabel(product)} demand.`,
        urgency: 'soon',
      })
    }
  }

  return alerts.sort((a, b) => (a.urgency === b.urgency ? 0 : a.urgency === 'now' ? -1 : 1))
}

/** Upcoming holidays within the next `windowMonths`, with matching products. */
export function upcomingHolidays(products: CatalogProduct[], now: Date = new Date(), windowMonths = 3) {
  const month = now.getMonth() + 1
  return HOLIDAYS.filter(h => {
    const distance = (h.month - month + 12) % 12
    return distance > 0 && distance <= windowMonths
  }).map(h => ({
    holiday: h,
    products: products.filter(prod => prod.holidays.includes(h.id)),
  }))
}
