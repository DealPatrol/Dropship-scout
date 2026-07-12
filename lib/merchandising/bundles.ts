// lib/merchandising/bundles.ts
// Bundle & cross-sell suggestions: hand-picked pairings first,
// then high-scoring products from the same niches.

import { getProduct, PRODUCTS } from './data'
import { opportunityScore } from './scoring'
import type { BundleSuggestion, CatalogProduct } from './types'

export function bundleSuggestions(product: CatalogProduct, limit = 5): BundleSuggestion[] {
  const suggestions: BundleSuggestion[] = []
  const seen = new Set<string>([product.id])

  for (const id of product.bundleWith) {
    const partner = getProduct(id)
    if (!partner || seen.has(partner.id)) continue
    seen.add(partner.id)
    suggestions.push({ product: partner, reason: 'Frequently bought together' })
  }

  if (suggestions.length < limit) {
    const sameNiche = PRODUCTS.filter(
      candidate =>
        !seen.has(candidate.id) &&
        candidate.niches.some(n => product.niches.includes(n))
    ).sort((a, b) => opportunityScore(b).total - opportunityScore(a).total)

    for (const candidate of sameNiche) {
      if (suggestions.length >= limit) break
      seen.add(candidate.id)
      suggestions.push({
        product: candidate,
        reason: `Top seller in ${candidate.niches.find(n => product.niches.includes(n))}`,
      })
    }
  }

  return suggestions.slice(0, limit)
}

/** Estimated average-order-value lift if the merchant offers this bundle. */
export function bundleValue(product: CatalogProduct, suggestions: BundleSuggestion[]) {
  const partners = suggestions.slice(0, 3)
  const bundlePrice = product.price + partners.reduce((sum, s) => sum + s.product.price, 0)
  const aovLift = Math.round((bundlePrice / product.price - 1) * 100 * 0.35)
  return { bundlePrice: Math.round(bundlePrice * 100) / 100, aovLiftPercent: aovLift }
}

/**
 * Catalog products whose bundle partners are missing from the catalog —
 * used for "bundles missing" recommendations.
 */
export function missingBundlePartners(catalogProducts: CatalogProduct[]): { product: CatalogProduct; partners: CatalogProduct[] }[] {
  const inCatalog = new Set(catalogProducts.map(prod => prod.id))
  const result: { product: CatalogProduct; partners: CatalogProduct[] }[] = []

  for (const product of catalogProducts) {
    const partners = product.bundleWith
      .filter(id => !inCatalog.has(id))
      .map(id => getProduct(id))
      .filter((partner): partner is CatalogProduct => Boolean(partner))
    if (partners.length > 0) result.push({ product, partners })
  }

  return result
}
