// lib/types.ts
// Shared TypeScript types for the entire application

export type TrendLabel = '🔥 Hot' | '📈 Rising' | '✅ Stable' | '⚡ Viral'
export type CompetitionLevel = 'Low' | 'Medium' | 'High'
export type PushStatus = 'success' | 'failed'

export type SupplierPlatform =
  | 'aliexpress'
  | 'amazon'
  | 'temu'
  | 'walmart'
  | 'ebay'
  | 'cjdropship'
  | 'spocket'
  | 'zendrop'

export interface Product {
  id?: string
  name: string
  category: string
  trend: TrendLabel
  margin: number
  sellPrice: string
  sourcePrice: string
  monthlySales: string
  rating: number
  competition: CompetitionLevel
  score: number
  platforms: SupplierPlatform[]
  tags: string[]
  aiInsight: string
  imageUrl?: string
  savedAt?: string
  updatedAt?: string
}

export interface TrackedProduct extends Product {
  id: string
  previousScore?: number
  priceHistory?: { price: number; date: string }[]
}

export interface PushHistoryEntry {
  id: string
  shopifyProductId?: string
  productName: string
  sellPrice: number
  pushedAt: string
  status: PushStatus
  errorMessage?: string
}

export interface SearchSession {
  platforms: SupplierPlatform[]
  category: string
  sortBy: string
  customNiche: string
  results: Product[]
  searchedAt: string
}

export interface ShopifyCredentials {
  domain: string
  token: string
}

export interface SearchParams {
  platforms: SupplierPlatform[]
  category: string
  sortBy: string
  customNiche: string
  userId?: string
}
