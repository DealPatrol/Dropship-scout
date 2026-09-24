// lib/api.ts
// Clean frontend client for all backend API calls.
// Import and use these in your React components instead of raw fetch().

import { Product, PushHistoryEntry, SearchSession } from '@/types'

const BASE = process.env.NEXT_PUBLIC_APP_URL || ''

// ─── Products ────────────────────────────────────────────────────────────────

export async function searchProducts(params: {
  platforms: string[]
  category: string
  sortBy: string
  customNiche: string
  userId?: string
}): Promise<Product[]> {
  const res = await fetch(`${BASE}/api/products/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Search failed')
  return data.products
}

export async function getSavedProducts(userId: string): Promise<Product[]> {
  const res = await fetch(`${BASE}/api/products/saved?userId=${userId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load saved products')
  return data.products
}

export async function saveProduct(userId: string, product: Product): Promise<string> {
  const res = await fetch(`${BASE}/api/products/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, product }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to save product')
  return data.id
}

export async function deleteSavedProduct(userId: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/products/saved?id=${id}&userId=${userId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to delete product')
  }
}

// ─── Shopify ─────────────────────────────────────────────────────────────────

export async function pushToShopify(params: {
  domain: string
  token: string
  products: Product[]
  userId?: string
}): Promise<{ pushed: number; total: number; results: any[] }> {
  const res = await fetch(`${BASE}/api/shopify/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Push failed')
  return data
}

export async function getShopifyDomain(userId: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/shopify/credentials?userId=${userId}`)
  const data = await res.json()
  return data.domain || null
}

export async function saveShopifyCredentials(userId: string, domain: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/shopify/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, domain, token }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to save credentials')
  }
}

export async function getPushHistory(userId: string): Promise<PushHistoryEntry[]> {
  const res = await fetch(`${BASE}/api/shopify/history?userId=${userId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load history')
  return data.history
}

// ─── Session ─────────────────────────────────────────────────────────────────

export async function getLastSession(userId: string): Promise<SearchSession | null> {
  const res = await fetch(`${BASE}/api/auth/session?userId=${userId}`)
  const data = await res.json()
  return data.session || null
}
