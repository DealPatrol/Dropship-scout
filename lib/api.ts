// lib/api.ts
// Clean frontend client for all backend API calls.
// Import and use these in your React components instead of raw fetch().

import { Product, PushHistoryEntry, SearchSession, SearchParams, AnalyticsData, SyncSummary } from './types'

const BASE = process.env.NEXT_PUBLIC_APP_URL || ''

// ─── Products ────────────────────────────────────────────────────────────────

export async function searchProducts(params: SearchParams): Promise<Product[]> {
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

export async function getRecommendations(userId: string, limit = 6): Promise<Product[]> {
  const res = await fetch(`${BASE}/api/products/recommendations?userId=${userId}&limit=${limit}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load recommendations')
  return data.recommendations
}

export async function exportProducts(userId: string, format: 'shopify' | 'simple'): Promise<void> {
  const res = await fetch(`${BASE}/api/products/export?userId=${userId}&format=${format}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || 'Export failed')
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? `dropship-export.csv`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function syncProducts(
  userId: string,
  productIds?: string[]
): Promise<{ summary: SyncSummary }> {
  const res = await fetch(`${BASE}/api/suppliers/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productIds }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Sync failed')
  return data
}

export async function getAnalytics(userId: string): Promise<AnalyticsData> {
  const res = await fetch(`${BASE}/api/analytics?userId=${userId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load analytics')
  return data as AnalyticsData
}

// ─── Shopify ─────────────────────────────────────────────────────────────────

export async function pushToShopify(params: {
  userId: string
  products: Product[]
}): Promise<{ pushed: number; total: number; results: unknown[] }> {
  const res = await fetch(`${BASE}/api/shopify/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Push failed')
  return data
}

export async function validateShopify(
  domain: string,
  token: string
): Promise<{ valid: boolean; shopName?: string; error?: string }> {
  const res = await fetch(`${BASE}/api/shopify/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, token }),
  })
  const data = await res.json()
  // validate endpoint always returns 200; check the `valid` field
  return data
}

export async function getShopifyDomain(userId: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/shopify/credentials?userId=${userId}`)
  if (!res.ok) return null
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
