// lib/merchandising/fulfillment.ts
// Dropshipping economics for catalog products, and conversion into the
// Shopify push pipeline. The model: the product is listed on the merchant's
// store at `price`; when a customer buys, the merchant orders it from a
// supplier at `cost` (supplier ships direct to the customer) and keeps the
// difference minus fees.

import { getSearchUrl, SUPPLIERS } from '@/lib/suppliers'
import { revenueImpact } from './scoring'
import { marginPercent, NICHE_MAP } from './data'
import type { Product, SupplierPlatform, TrendLabel } from '@/lib/types'
import type { CatalogProduct, ProductTrend } from './types'

export interface ProfitPerSale {
  sellPrice: number
  supplierCost: number
  /** Estimated payment processing fees (~2.9% + $0.30) */
  fees: number
  profit: number
  marginPercent: number
}

export interface DropshipEconomics {
  perSale: ProfitPerSale
  /** Monthly units a new store can realistically capture */
  monthlyUnitsLow: number
  monthlyUnitsHigh: number
  /** Monthly profit at the midpoint of the units range */
  monthlyProfit: number
}

export function profitPerSale(product: CatalogProduct): ProfitPerSale {
  const fees = Math.round((product.price * 0.029 + 0.3) * 100) / 100
  const profit = Math.round((product.price - product.cost - fees) * 100) / 100
  return {
    sellPrice: product.price,
    supplierCost: product.cost,
    fees,
    profit,
    marginPercent: marginPercent(product),
  }
}

export function dropshipEconomics(product: CatalogProduct): DropshipEconomics {
  const perSale = profitPerSale(product)
  const impact = revenueImpact(product)
  const midUnits = Math.round((impact.monthlyUnitsLow + impact.monthlyUnitsHigh) / 2)
  return {
    perSale,
    monthlyUnitsLow: impact.monthlyUnitsLow,
    monthlyUnitsHigh: impact.monthlyUnitsHigh,
    monthlyProfit: Math.round(midUnits * perSale.profit),
  }
}

export interface SupplierSource {
  platform: SupplierPlatform
  label: string
  shippingDays: string
  orderUrl: string
}

/** Where to order this product from when a customer buys it. */
export function supplierSources(product: CatalogProduct): SupplierSource[] {
  return product.suppliers.map(platform => ({
    platform,
    label: SUPPLIERS[platform].label,
    shippingDays: SUPPLIERS[platform].shippingDays,
    orderUrl: getSearchUrl(platform, product.name),
  }))
}

function toTrendLabel(trend: ProductTrend): TrendLabel {
  switch (trend) {
    case 'hot':
      return '🔥 Hot'
    case 'rising':
      return '📈 Rising'
    case 'stable':
      return '✅ Stable'
    case 'declining':
      return '📉 Declining'
    default: {
      const exhaustiveTrend: never = trend
      return exhaustiveTrend
    }
  }
}

/**
 * Converts a discovery-catalog product into the shape the existing Shopify
 * push pipeline (`/api/shopify/push` → `buildShopifyPayload`) expects.
 * The supplier cost is recorded in the listing description and SKU flow so
 * the merchant always knows their per-sale spread.
 */
export function toPushableProduct(product: CatalogProduct): Product {
  const primaryNiche = NICHE_MAP[product.niches[0]]
  const perSale = profitPerSale(product)

  return {
    id: product.id,
    name: product.name,
    category: primaryNiche.label,
    trend: toTrendLabel(product.trend),
    margin: perSale.marginPercent,
    sellPrice: product.price.toFixed(2),
    sourcePrice: product.cost.toFixed(2),
    monthlySales: `${(product.monthlyOrders / 1000).toFixed(1)}k`,
    rating: product.rating,
    competition: product.competition,
    score: Math.round((perSale.marginPercent + product.demand) / 20 * 10) / 10,
    platforms: product.suppliers,
    tags: [...product.tags, ...product.niches.map(n => NICHE_MAP[n].label)],
    aiInsight: `${product.audience}. Source from ${product.suppliers.map(s => SUPPLIERS[s].label).join(' or ')} at ~$${product.cost.toFixed(2)} and keep ~$${perSale.profit.toFixed(2)} per sale after fees.`,
    imageUrl: '',
  }
}
