// lib/merchandising/scoring.ts
// Deterministic scoring engine: Opportunity Score per product,
// Catalog Health Score for a set of products, and revenue impact estimates.

import { marginPercent } from './data'
import type {
  CatalogProduct,
  CatalogScore,
  CatalogScoreComponent,
  OpportunityScore,
  RevenueImpact,
} from './types'

const COMPETITION_SCORE: Record<CatalogProduct['competition'], number> = {
  Low: 90,
  Medium: 62,
  High: 38,
}

const TREND_SCORE: Record<CatalogProduct['trend'], number> = {
  hot: 95,
  rising: 85,
  stable: 70,
  declining: 30,
}

function supplierQuality(product: CatalogProduct): number {
  const countScore = Math.min(product.supplierCount / 8, 1) * 50
  const shippingScore = Math.max(0, 1 - (product.shippingDays - 5) / 10) * 50
  return Math.round(countScore + shippingScore)
}

/**
 * Weighted 0-100 score combining demand, competition, margin, supplier
 * quality and trend signals — the "one number" merchants sort by.
 */
export function opportunityScore(product: CatalogProduct): OpportunityScore {
  const margin = marginPercent(product)
  const breakdown = {
    demand: product.demand,
    competition: COMPETITION_SCORE[product.competition],
    margin: Math.min(Math.round((margin / 70) * 100), 100),
    supplierQuality: supplierQuality(product),
    trendStability: product.trendStability,
    trendDirection: TREND_SCORE[product.trend],
  }

  const total = Math.round(
    breakdown.demand * 0.28 +
      breakdown.competition * 0.18 +
      breakdown.margin * 0.2 +
      breakdown.supplierQuality * 0.12 +
      breakdown.trendStability * 0.1 +
      breakdown.trendDirection * 0.12
  )

  const reasons: string[] = []
  if (product.demand >= 80) reasons.push(`Strong demand — roughly ${formatOrders(product.monthlyOrders)} orders/month across suppliers.`)
  else if (product.demand >= 70) reasons.push('Steady demand with consistent monthly order volume.')
  if (product.competition === 'Low') reasons.push('Only a small number of stores are actively selling it.')
  if (product.competition === 'High') reasons.push('Competition is crowded — differentiation via bundles or creative is needed.')
  reasons.push(`Average profit margin is ${margin}%.`)
  if (product.shippingDays <= 8) reasons.push(`Suppliers ship in ~${product.shippingDays} days on average.`)
  if (product.trend === 'hot' || product.trend === 'rising') reasons.push('Demand is expected to keep growing over the next three months.')
  if (product.trend === 'declining') reasons.push('Demand is trending down — treat as a short-term play.')
  if (product.seasonality === 'evergreen') reasons.push('Evergreen product that sells year-round.')

  return { total, breakdown, reasons }
}

/**
 * "Potential Revenue Impact" estimate attached to every recommendation.
 * Ranges are intentionally broad; confidence comes from trend stability.
 */
export function revenueImpact(product: CatalogProduct): RevenueImpact {
  const score = opportunityScore(product).total
  // A new store realistically captures a small slice of observed volume.
  const captureRate = 0.012 + (score / 100) * 0.02
  const mid = Math.max(10, Math.round(product.monthlyOrders * captureRate))
  const low = Math.max(5, Math.round(mid * 0.65))
  const high = Math.round(mid * 1.45)
  const monthlyRevenue = Math.round(mid * product.price)

  const confidence: RevenueImpact['confidence'] =
    product.trendStability >= 78 ? 'High' : product.trendStability >= 62 ? 'Medium' : 'Low'

  const margin = marginPercent(product)
  const why = [
    product.demand >= 78 ? 'strong demand' : 'steady demand',
    product.competition === 'Low' ? 'low competition' : `${product.competition.toLowerCase()} competition`,
    `${margin}% margin`,
  ].join(', ')

  return {
    monthlyUnitsLow: low,
    monthlyUnitsHigh: high,
    monthlyRevenue,
    confidence,
    why: `Based on ${why}.`,
  }
}

function formatOrders(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ─── Catalog Health Score ─────────────────────────────────────────────────────

function componentScore(id: string, label: string, score: number, detail: string): CatalogScoreComponent {
  return { id, label, score: Math.round(Math.max(0, Math.min(100, score))), detail }
}

/**
 * Scores an assembled catalog on balance and potential across six
 * dimensions, and produces concrete strengths + improvement suggestions.
 */
export function catalogScore(products: CatalogProduct[]): CatalogScore {
  if (products.length === 0) {
    return {
      total: 0,
      components: [],
      strengths: [],
      suggestions: ['Add your first products to get a Catalog Score.'],
    }
  }

  const count = products.length
  const nicheSet = new Set(products.flatMap(prod => prod.niches))
  const avgMargin = products.reduce((sum, prod) => sum + marginPercent(prod), 0) / count
  const evergreenShare = products.filter(prod => prod.seasonality === 'evergreen').length / count
  const avgOpportunity = products.reduce((sum, prod) => sum + opportunityScore(prod).total, 0) / count
  const impulseShare = products.filter(prod => prod.impulse).length / count
  const recurringCount = products.filter(prod => prod.recurring).length
  const bundleCoverage =
    products.filter(prod =>
      prod.bundleWith.some(id => products.some(other => other.id === id))
    ).length / count
  const q4Count = products.filter(
    prod => prod.seasonality === 'evergreen' || prod.peakMonths.some(m => m >= 10 || m === 1)
  ).length

  const components: CatalogScoreComponent[] = [
    componentScore('diversity', 'Product Diversity', Math.min(nicheSet.size / 5, 1) * 100, `${nicheSet.size} niches covered`),
    componentScore('margin', 'Average Margin', (avgMargin / 65) * 100, `${Math.round(avgMargin)}% average margin`),
    componentScore('seasonal', 'Seasonal Balance', 100 - Math.abs(evergreenShare - 0.72) * 220, `${Math.round(evergreenShare * 100)}% evergreen / ${Math.round((1 - evergreenShare) * 100)}% seasonal`),
    componentScore('opportunity', 'Avg Opportunity Score', avgOpportunity, `${Math.round(avgOpportunity)}/100 average product score`),
    componentScore('bundles', 'Bundling Potential', bundleCoverage * 100 + 20, `${Math.round(bundleCoverage * 100)}% of products have a bundle partner in your catalog`),
    componentScore('impulse', 'Impulse & Repeat Buys', impulseShare * 160 + recurringCount * 8, `${Math.round(impulseShare * 100)}% impulse buys, ${recurringCount} repeat-purchase products`),
  ]

  const total = Math.round(components.reduce((sum, c) => sum + c.score, 0) / components.length)

  const strengths: string[] = []
  const suggestions: string[] = []

  if (nicheSet.size >= 4) strengths.push('Diverse niches')
  else suggestions.push(`Add products from ${4 - nicheSet.size} more niche${nicheSet.size === 3 ? '' : 's'} to diversify.`)

  if (avgMargin >= 55) strengths.push('High average margin')
  else suggestions.push('Swap in higher-margin products to lift average margin above 55%.')

  if (evergreenShare >= 0.6 && evergreenShare <= 0.85) strengths.push('Healthy evergreen/seasonal mix')
  else if (evergreenShare > 0.85) suggestions.push('Add a few seasonal products to capture holiday demand spikes.')
  else suggestions.push(`Only ${Math.round(evergreenShare * 100)}% of your products are evergreen — add year-round sellers.`)

  if (products.filter(prod => prod.impulse && prod.price < 25).length >= 2) strengths.push('Good impulse-buy coverage')
  else suggestions.push('Add 2 impulse-buy products under $25 to lift conversion.')

  if (recurringCount >= 2) strengths.push('Repeat-purchase potential')
  else suggestions.push('Include more products with recurring purchase potential.')

  if (q4Count / count >= 0.5) strengths.push('Strong Q4 coverage')
  else suggestions.push('Your Q4 catalog is weak — consider adding Christmas gifts and indoor products.')

  const supplierAvg = products.reduce((sum, prod) => sum + prod.supplierCount, 0) / count
  if (supplierAvg >= 5) strengths.push('Good supplier availability')

  return { total, components, strengths, suggestions }
}
