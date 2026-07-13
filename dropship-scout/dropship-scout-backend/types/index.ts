// types/index.ts

export interface Product {
  id?: string
  name: string
  category: string
  trend: '🔥 Hot' | '📈 Rising' | '✅ Stable' | '⚡ Viral'
  margin: number
  sellPrice: string
  sourcePrice: string
  monthlySales: string
  rating: number
  competition: 'Low' | 'Medium' | 'High'
  score: number
  platforms: string[]
  tags: string[]
  aiInsight: string
  imageUrl?: string
  savedAt?: string
}

export interface PushHistoryEntry {
  id: string
  shopifyProductId?: string
  productName: string
  sellPrice: number
  pushedAt: string
  status: 'success' | 'failed'
  errorMessage?: string
}

export interface SearchSession {
  platforms: string[]
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
