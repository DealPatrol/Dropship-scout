// lib/merchandising/types.ts
// Domain types for the AI Merchandising Manager feature set:
// product discovery catalog, opportunity scoring, seasonal planning and bundles.

import type { CompetitionLevel, SupplierPlatform } from '@/lib/types'

export type NicheId =
  | 'pets'
  | 'home'
  | 'fitness'
  | 'beauty'
  | 'automotive'
  | 'baby'
  | 'electronics'
  | 'outdoor'
  | 'office'
  | 'fashion'

export interface Niche {
  id: NicheId
  label: string
  emoji: string
  description: string
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter'

export type HolidayId =
  | 'valentines'
  | 'easter'
  | 'mothers_day'
  | 'fathers_day'
  | 'july4'
  | 'back_to_school'
  | 'halloween'
  | 'thanksgiving'
  | 'black_friday'
  | 'christmas'

export interface Holiday {
  id: HolidayId
  label: string
  emoji: string
  month: number // 1-12
}

export type ProductTrend = 'hot' | 'rising' | 'stable' | 'declining'

/** 0 = low, 1 = moderate, 2 = strong, 3 = peak */
export type DemandLevel = 0 | 1 | 2 | 3

export interface CatalogProduct {
  id: string
  name: string
  /** First entry is the primary niche. 2+ entries = multi-niche winner. */
  niches: NicheId[]
  cost: number
  price: number
  monthlyOrders: number
  rating: number
  competition: CompetitionLevel
  shippingDays: number
  supplierCount: number
  suppliers: SupplierPlatform[]
  trend: ProductTrend
  /** Market demand strength, 0-100 */
  demand: number
  /** How stable demand is over time, 0-100 */
  trendStability: number
  seasonality: 'evergreen' | 'seasonal'
  /** Months (1-12) of peak demand. Empty for flat evergreen products. */
  peakMonths: number[]
  holidays: HolidayId[]
  audience: string
  adPlatform: string
  impulse: boolean
  recurring: boolean
  /** Hand-picked complementary product ids. Auto-filled from niche when empty. */
  bundleWith: string[]
  tags: string[]
}

export interface OpportunityBreakdown {
  demand: number
  competition: number
  margin: number
  supplierQuality: number
  trendStability: number
  trendDirection: number
}

export interface OpportunityScore {
  total: number
  breakdown: OpportunityBreakdown
  reasons: string[]
}

export interface RevenueImpact {
  monthlyUnitsLow: number
  monthlyUnitsHigh: number
  monthlyRevenue: number
  confidence: 'High' | 'Medium' | 'Low'
  why: string
}

export interface CatalogScoreComponent {
  id: string
  label: string
  score: number
  detail: string
}

export interface CatalogScore {
  total: number
  components: CatalogScoreComponent[]
  strengths: string[]
  suggestions: string[]
}

export interface CatalogItem {
  id: string
  productId: string
  addedAt: string
  source: 'manual' | 'ai_builder' | 'suggestion'
  /** Set when the product has been listed on the user's store */
  pushedAt?: string
  shopifyProductId?: string
}

export interface SeasonalAlert {
  productId: string
  message: string
  urgency: 'now' | 'soon'
}

export interface BundleSuggestion {
  product: CatalogProduct
  reason: string
}

export type TimingFilterId =
  | 'this_month'
  | 'next_3_months'
  | Season
  | HolidayId

export interface BuilderCriteria {
  niches: NicheId[]
  count: number
  maxPrice?: number
  minMargin?: number
  multiNicheOnly?: boolean
  impulseOnly?: boolean
  prompt: string
}

export interface BuilderResult {
  criteria: BuilderCriteria
  products: CatalogProduct[]
  summary: string
}
