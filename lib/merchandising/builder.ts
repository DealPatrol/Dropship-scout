// lib/merchandising/builder.ts
// AI Catalog Builder: turns a natural-language goal ("build me a pet store
// with 50 winning products") into selection criteria, then assembles a
// balanced catalog deterministically from the product dataset.
//
// The heuristic parser makes the builder fully functional offline; the API
// route can upgrade parsing with Claude when a key is configured.

import { marginPercent, NICHES, PRODUCTS } from './data'
import { opportunityScore } from './scoring'
import type { BuilderCriteria, BuilderResult, CatalogProduct, NicheId } from './types'

const NICHE_KEYWORDS: Record<NicheId, string[]> = {
  pets: ['pet', 'dog', 'cat', 'animal'],
  home: ['home', 'kitchen', 'house', 'decor', 'décor'],
  fitness: ['fitness', 'gym', 'workout', 'yoga', 'exercise'],
  beauty: ['beauty', 'skincare', 'skin care', 'makeup', 'hair'],
  automotive: ['car', 'auto', 'vehicle', 'driving'],
  baby: ['baby', 'infant', 'toddler', 'parent'],
  electronics: ['electronic', 'gadget', 'tech', 'device'],
  outdoor: ['outdoor', 'camping', 'beach', 'summer', 'garden', 'hiking'],
  office: ['office', 'desk', 'work from home', 'wfh', 'remote work'],
  fashion: ['fashion', 'apparel', 'clothing', 'accessor', 'wear'],
}

/** Regex/keyword fallback parser for builder prompts. */
export function parseBuilderPrompt(prompt: string): BuilderCriteria {
  const lower = prompt.toLowerCase()

  const niches = NICHES.filter(n =>
    NICHE_KEYWORDS[n.id].some(keyword => lower.includes(keyword))
  ).map(n => n.id)

  const countMatch = lower.match(/(\d+)\s*(?:winning\s+)?products?/)
  const count = countMatch ? Math.min(Math.max(parseInt(countMatch[1], 10), 3), 100) : 25

  const priceMatch = lower.match(/under\s*\$?\s*(\d+)/)
  const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : undefined

  const marginMatch = lower.match(/(\d+)\s*%\s*(?:profit\s*)?margin/)
  const minMargin = marginMatch ? parseInt(marginMatch[1], 10) : undefined

  const multiNicheOnly = /multi[- ]?niche|(two|three|2|3)\s?(or more|\+)\s*niches/.test(lower)
  const impulseOnly = /impulse|viral|tiktok/.test(lower)

  return { niches, count, maxPrice, minMargin, multiNicheOnly, impulseOnly, prompt }
}

/**
 * Selects the highest-scoring products matching the criteria, keeping the
 * catalog balanced: mostly evergreen with a seasonal slice, and spread
 * across niches when more than one qualifies.
 */
export function buildCatalog(criteria: BuilderCriteria): BuilderResult {
  let pool = PRODUCTS.filter(product => {
    if (criteria.niches.length > 0 && !product.niches.some(n => criteria.niches.includes(n))) return false
    if (criteria.maxPrice !== undefined && product.price > criteria.maxPrice) return false
    if (criteria.minMargin !== undefined && marginPercent(product) < criteria.minMargin) return false
    if (criteria.multiNicheOnly && product.niches.length < 2) return false
    if (criteria.impulseOnly && !product.impulse) return false
    return true
  })

  pool = pool.sort((a, b) => opportunityScore(b).total - opportunityScore(a).total)

  if (criteria.niches.length !== 1) {
    const productsByNiche = new Map<NicheId, CatalogProduct[]>()
    for (const product of pool) {
      const primaryNiche = product.niches[0]
      productsByNiche.set(primaryNiche, [...(productsByNiche.get(primaryNiche) ?? []), product])
    }

    if (productsByNiche.size > 1) {
      const balancedPool: CatalogProduct[] = []
      for (let index = 0; balancedPool.length < pool.length; index++) {
        for (const products of productsByNiche.values()) {
          if (products[index]) balancedPool.push(products[index])
        }
      }
      pool = balancedPool
    }
  }

  const targetSeasonal = Math.round(criteria.count * 0.25)
  const selected: CatalogProduct[] = []
  let seasonalCount = 0

  for (const product of pool) {
    if (selected.length >= criteria.count) break
    if (product.seasonality === 'seasonal') {
      if (seasonalCount >= targetSeasonal && pool.some(other => other.seasonality === 'evergreen' && !selected.includes(other))) {
        continue
      }
      seasonalCount++
    }
    selected.push(product)
  }

  // Backfill with remaining products if the seasonal cap left us short.
  for (const product of pool) {
    if (selected.length >= criteria.count) break
    if (!selected.includes(product)) selected.push(product)
  }

  const avgScore = selected.length
    ? Math.round(selected.reduce((sum, prod) => sum + opportunityScore(prod).total, 0) / selected.length)
    : 0
  const avgMargin = selected.length
    ? Math.round(selected.reduce((sum, prod) => sum + marginPercent(prod), 0) / selected.length)
    : 0

  const nicheLabel =
    criteria.niches.length > 0
      ? criteria.niches.map(id => NICHES.find(n => n.id === id)?.label ?? id).join(', ')
      : 'multiple niches'

  const summary =
    selected.length === 0
      ? 'No products matched those criteria. Try relaxing the price or margin limits.'
      : `Built a ${selected.length}-product catalog across ${nicheLabel} — average Opportunity Score ${avgScore}/100, average margin ${avgMargin}%, ${selected.filter(prod => prod.seasonality === 'evergreen').length} evergreen and ${selected.filter(prod => prod.seasonality === 'seasonal').length} seasonal products.`

  return { criteria, products: selected, summary }
}
