'use client'

// lib/merchandising/use-catalog.ts
// Client-side catalog state: persists to the API (Supabase) and falls back
// to localStorage when the backend is unavailable (e.g. the catalog_items
// migration has not been run yet), so the feature always works.

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildCatalog, parseBuilderPrompt } from './builder'
import { getProduct } from './data'
import type { BuilderResult, CatalogItem, CatalogProduct } from './types'

const STORAGE_KEY_PREFIX = 'repodrop-catalog'

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`
}

function readLocal(userId: string): CatalogItem[] | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw === null ? null : (JSON.parse(raw) as CatalogItem[])
  } catch {
    return null
  }
}

function writeLocal(userId: string, items: CatalogItem[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items))
  } catch {
    // storage unavailable — state stays in memory
  }
}

function clearLocal(userId: string) {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // storage unavailable — no local fallback to clear
  }
}

function toItems(productIds: string[], source: CatalogItem['source']): CatalogItem[] {
  const now = new Date().toISOString()
  return productIds.map(productId => ({
    id: `local-${productId}`,
    productId,
    addedAt: now,
    source,
  }))
}

function mergeItems(existing: CatalogItem[], added: CatalogItem[]): CatalogItem[] {
  const have = new Set(existing.map(item => item.productId))
  return [...added.filter(item => !have.has(item.productId)), ...existing]
}

export interface PushToStoreResult {
  pushed: number
  total: number
  error?: string
}

export interface UseCatalog {
  items: CatalogItem[]
  products: CatalogProduct[]
  productIds: Set<string>
  /** Product ids already listed on the user's store */
  pushedIds: Set<string>
  /** Connected Shopify store domain, if any */
  shopifyDomain: string | null
  loading: boolean
  addProducts: (productIds: string[], source?: CatalogItem['source']) => Promise<void>
  removeProduct: (productId: string) => Promise<void>
  runBuilder: (prompt: string) => Promise<{ summary: string; added: number }>
  pushToStore: (productIds: string[]) => Promise<PushToStoreResult>
}

export function useCatalog(userId: string): UseCatalog {
  const [items, setItems] = useState<CatalogItem[]>([])
  const itemsRef = useRef<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [remote, setRemote] = useState(true)
  const [shopifyDomain, setShopifyDomain] = useState<string | null>(null)

  const replaceItems = useCallback((next: CatalogItem[]) => {
    itemsRef.current = next
    setItems(next)
  }, [])

  const updateItems = useCallback((updater: (current: CatalogItem[]) => CatalogItem[]) => {
    const next = updater(itemsRef.current)
    itemsRef.current = next
    setItems(next)
    return next
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchCatalog(): Promise<CatalogItem[]> {
      const res = await fetch('/api/catalog')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data.items
    }

    async function load() {
      try {
        let remoteItems = await fetchCatalog()
        const localItems = readLocal(userId)

        if (localItems !== null) {
          const remoteIds = new Set(remoteItems.map(item => item.productId))

          for (const item of localItems.filter(item => !remoteIds.has(item.productId))) {
            const res = await fetch('/api/catalog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productIds: [item.productId], source: item.source }),
            })
            if (!res.ok) throw new Error()
          }

          remoteItems = await fetchCatalog()
          clearLocal(userId)
        }

        if (!cancelled) {
          replaceItems(remoteItems)
          setRemote(true)
        }
      } catch {
        if (!cancelled) {
          replaceItems(readLocal(userId) ?? [])
          setRemote(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function loadStore() {
      try {
        const res = await fetch(`/api/shopify/credentials?userId=${userId}`)
        const data = await res.json()
        if (!cancelled) setShopifyDomain(data.domain || null)
      } catch {
        if (!cancelled) setShopifyDomain(null)
      }
    }

    load()
    loadStore()
    return () => {
      cancelled = true
    }
  }, [replaceItems, userId])

  const addProducts = useCallback(
    async (productIds: string[], source: CatalogItem['source'] = 'manual') => {
      const next = updateItems(current => mergeItems(current, toItems(productIds, source)))

      if (remote) {
        try {
          const res = await fetch('/api/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds, source }),
          })
          if (!res.ok) throw new Error()
          return
        } catch {
          setRemote(false)
          writeLocal(userId, itemsRef.current)
          return
        }
      }
      writeLocal(userId, next)
    },
    [remote, updateItems, userId]
  )

  const removeProduct = useCallback(
    async (productId: string) => {
      const next = updateItems(current => current.filter(item => item.productId !== productId))

      if (remote) {
        try {
          const res = await fetch(`/api/catalog?productId=${productId}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error()
          return
        } catch {
          setRemote(false)
          writeLocal(userId, itemsRef.current)
          return
        }
      }
      writeLocal(userId, next)
    },
    [remote, updateItems, userId]
  )

  const runBuilder = useCallback(
    async (prompt: string): Promise<{ summary: string; added: number }> => {
      if (remote) {
        try {
          const res = await fetch('/api/catalog/build', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          updateItems(current => mergeItems(current, toItems(data.productIds, 'ai_builder')))
          return { summary: data.summary, added: data.added }
        } catch {
          setRemote(false)
        }
      }

      // Offline path: same deterministic builder, run locally.
      const result: BuilderResult = buildCatalog(parseBuilderPrompt(prompt))
      let added = 0
      const next = updateItems(current => {
        const merged = mergeItems(current, toItems(result.products.map(product => product.id), 'ai_builder'))
        added = merged.length - current.length
        return merged
      })
      writeLocal(userId, next)
      return { summary: result.summary, added }
    },
    [remote, updateItems, userId]
  )

  const pushToStore = useCallback(
    async (productIds: string[]): Promise<PushToStoreResult> => {
      try {
        const res = await fetch('/api/shopify/push-catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        })
        const data = await res.json()
        if (!res.ok) return { pushed: 0, total: productIds.length, error: data.error }

        const pushedNow = new Set(
          (data.results as { productId: string; success: boolean }[])
            .filter(r => r.success)
            .map(r => r.productId)
        )
        const now = new Date().toISOString()
        const next = updateItems(current =>
          mergeItems(current, toItems(Array.from(pushedNow), 'manual')).map(item =>
            pushedNow.has(item.productId) ? { ...item, pushedAt: now } : item
          )
        )
        if (!remote) writeLocal(userId, next)
        return { pushed: data.pushed, total: data.total }
      } catch {
        return {
          pushed: 0,
          total: productIds.length,
          error: 'Could not reach the store connection. Check Settings and try again.',
        }
      }
    },
    [remote, updateItems, userId]
  )

  const products = items
    .map(item => getProduct(item.productId))
    .filter((product): product is CatalogProduct => Boolean(product))

  return {
    items,
    products,
    productIds: new Set(items.map(item => item.productId)),
    pushedIds: new Set(items.filter(item => item.pushedAt).map(item => item.productId)),
    shopifyDomain,
    loading,
    addProducts,
    removeProduct,
    runBuilder,
    pushToStore,
  }
}
