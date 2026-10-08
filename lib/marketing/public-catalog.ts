import type { CompetitionLevel } from '@/lib/types'
import { HOLIDAY_MAP, marginPercent, NICHES, NICHE_MAP, PRODUCTS } from '@/lib/merchandising/data'
import { SEASON_MONTHS, sellingWindowLabel } from '@/lib/merchandising/seasonal'
import type { NicheId, Season } from '@/lib/merchandising/types'

export interface PublicProduct {
  id: string
  name: string
  niches: string[]
  nicheIds: NicheId[]
  audience: string
  window: string
  competition: CompetitionLevel
  trend: string
  sampleCost: number
  samplePrice: number
  marginPercent: number
  shippingDays: number
  seasonality: 'evergreen' | 'seasonal'
  adPlatform: string
  peakMonths: number[]
  holidayMonths: number[]
}

/** Sample-catalog fields that are safe to show publicly. Omits order counts and demand scores. */
export function publicCatalog(): PublicProduct[] {
  return PRODUCTS.map(product => ({
    id: product.id,
    name: product.name,
    niches: product.niches.map(id => NICHE_MAP[id].label),
    nicheIds: product.niches,
    audience: product.audience,
    window: sellingWindowLabel(product),
    competition: product.competition,
    trend: product.trend,
    sampleCost: product.cost,
    samplePrice: product.price,
    marginPercent: marginPercent(product),
    shippingDays: product.shippingDays,
    seasonality: product.seasonality,
    adPlatform: product.adPlatform,
    peakMonths: product.peakMonths,
    holidayMonths: product.holidays.map(id => HOLIDAY_MAP[id].month),
  }))
}

export function seasonForDate(date: Date): Season {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

export function matchesSeason(product: PublicProduct, season: Season): boolean {
  const months = SEASON_MONTHS[season]
  return product.peakMonths.some(month => months.includes(month)) || product.holidayMonths.some(month => months.includes(month))
}

export function productsForSeason(season: Season): PublicProduct[] {
  return publicCatalog().filter(product => matchesSeason(product, season))
}

export function lowCompetitionProducts(): PublicProduct[] {
  return publicCatalog().filter(product => product.competition === 'Low')
}

export function shortFormTaggedProducts(): PublicProduct[] {
  return publicCatalog().filter(product => product.adPlatform === 'TikTok')
}

export function publicNiches(): { id: NicheId; label: string; description: string }[] {
  return NICHES.map(niche => ({ id: niche.id, label: niche.label, description: niche.description }))
}
