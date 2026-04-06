// lib/suppliers.ts
// Supplier platform metadata and product sourcing helpers

import { SupplierPlatform } from './types'

export interface SupplierMeta {
  id: SupplierPlatform
  label: string
  shippingDays: string
  avgMargin: string
  minOrder: number
  searchUrl: string
}

export const SUPPLIERS: Record<SupplierPlatform, SupplierMeta> = {
  aliexpress: {
    id: 'aliexpress',
    label: 'AliExpress',
    shippingDays: '10–20 days',
    avgMargin: '40–70%',
    minOrder: 1,
    searchUrl: 'https://www.aliexpress.com/wholesale?SearchText=',
  },
  amazon: {
    id: 'amazon',
    label: 'Amazon',
    shippingDays: '2–5 days',
    avgMargin: '15–35%',
    minOrder: 1,
    searchUrl: 'https://www.amazon.com/s?k=',
  },
  temu: {
    id: 'temu',
    label: 'Temu',
    shippingDays: '7–15 days',
    avgMargin: '50–80%',
    minOrder: 1,
    searchUrl: 'https://www.temu.com/search_result.html?search_key=',
  },
  walmart: {
    id: 'walmart',
    label: 'Walmart',
    shippingDays: '2–5 days',
    avgMargin: '20–40%',
    minOrder: 1,
    searchUrl: 'https://www.walmart.com/search?q=',
  },
  ebay: {
    id: 'ebay',
    label: 'eBay',
    shippingDays: '3–10 days',
    avgMargin: '20–45%',
    minOrder: 1,
    searchUrl: 'https://www.ebay.com/sch/i.html?_nkw=',
  },
  cjdropship: {
    id: 'cjdropship',
    label: 'CJ Dropship',
    shippingDays: '7–15 days',
    avgMargin: '35–65%',
    minOrder: 1,
    searchUrl: 'https://cjdropshipping.com/product-list.html?name=',
  },
  spocket: {
    id: 'spocket',
    label: 'Spocket',
    shippingDays: '3–7 days',
    avgMargin: '30–60%',
    minOrder: 1,
    searchUrl: 'https://app.spocket.co/marketplace?query=',
  },
  zendrop: {
    id: 'zendrop',
    label: 'Zendrop',
    shippingDays: '5–10 days',
    avgMargin: '30–55%',
    minOrder: 1,
    searchUrl: 'https://app.zendrop.com/catalogue?search=',
  },
}

export function getSupplierMeta(platform: SupplierPlatform): SupplierMeta {
  return SUPPLIERS[platform]
}

export function getSearchUrl(platform: SupplierPlatform, query: string): string {
  return SUPPLIERS[platform].searchUrl + encodeURIComponent(query)
}

export function estimateMargin(sourcePrice: number, sellPrice: number): number {
  if (sellPrice <= 0) return 0
  return Math.round(((sellPrice - sourcePrice) / sellPrice) * 100)
}

export function suggestSellPrice(sourcePrice: number, targetMargin = 0.5): number {
  return parseFloat((sourcePrice / (1 - targetMargin)).toFixed(2))
}
