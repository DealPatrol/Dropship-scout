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
  | 'dhgate'
  | 'banggood'
  | 'geek'
  | 'wish'
  | 'shein'
  | 'lightinthebox'
  | 'miniinthebox'
  | 'tomtop'
  | 'newfrog'
  | 'shopify'
  | 'woocommerce'
  | 'buymeonce'

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

// Fulfillment System Types
export type StorePlatform = 'shopify' | 'woocommerce'
export type OrderStatus = 'pending' | 'submitted' | 'shipped' | 'delivered' | 'failed'
export type MarkupType = 'percentage' | 'fixed'

export interface StoreConnection {
  id: number
  userId: string
  platform: StorePlatform
  storeName: string
  storeUrl: string
  accessToken: string
  refreshToken?: string
  isActive: boolean
  webhooksConfigured: boolean
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface SupplierCredential {
  id: number
  userId: string
  supplier: SupplierPlatform
  apiKey?: string
  apiSecret?: string
  email?: string
  password?: string
  metadata?: Record<string, any>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductListing {
  id: number
  userId: string
  storeConnectionId: number
  storeProductId: string
  title: string
  description?: string
  costPrice: number
  sellingPrice: number
  margin: number
  supplier: SupplierPlatform
  supplierProductId?: string
  image?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ShippingAddress {
  firstName?: string
  lastName?: string
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface Order {
  id: number
  userId: string
  storeConnectionId: number
  storeOrderId: string
  customerName: string
  customerEmail: string
  shippingAddress: ShippingAddress
  totalAmount: number
  totalCost: number
  profit: number
  status: OrderStatus
  supplierOrderId?: string
  trackingNumber?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: number
  orderId: number
  productListingId: number
  quantity: number
  unitCost: number
  unitPrice: number
  lineTotal: number
  createdAt: Date
}

export interface PricingRule {
  id: number
  userId: string
  name: string
  description?: string
  markupType: MarkupType
  markupValue: number
  minPrice?: number
  maxPrice?: number
  appliedToSuppliers?: SupplierPlatform[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FulfillmentHistory {
  id: number
  orderId: number
  status: string
  message?: string
  metadata?: Record<string, any>
  createdAt: Date
}
