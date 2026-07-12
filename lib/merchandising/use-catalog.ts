'use client'

// lib/merchandising/use-catalog.ts
// Client-side catalog state: persists to the API (Supabase) and falls back
// to localStorage when the backend is unavailable (e.g. the catalog_items
// migration has not been run yet), so the feature always works.

import { useCallback, useEffect, useState } from 'react'
import { buildCatalog, parseBuilderPrompt } from './builder'
import { getProduct } from './data'
import type { BuilderResult, CatalogItem, CatalogProduct } from './types'

const STORAGE_KEY = 'repodrop-catalog'

function readLocal(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CatalogItem[]) : []
  } catch {
    return []
  }
}

function writeLocal(items: CatalogItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage unavailable — state stays in memory
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

export interface UseCatalog {
  items: CatalogItem[]
  products: CatalogProduct[]
  productIds: Set<string>
  loading: boolean
  addProducts: (productIds: string[], source?: CatalogItem['source']) => Promise<void>
  removeProduct: (productId: string) => Promise<void>
  runBuilder: (prompt: string) => Promise<{ summary: string; added: number }>
}

export function useCatalog(userId: string): UseCatalog {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [remote, setRemote] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/catalog?userId=${userId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        if (!cancelled) {
          setItems(data.items)
          setRemote(true)
        }
      } catch {
        if (!cancelled) {
          setItems(readLocal())
          setRemote(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const addProducts = useCallback(
    async (productIds: string[], source: CatalogItem['source'] = 'manual') => {
      const next = mergeItems(items, toItems(productIds, source))
      setItems(next)

      if (remote) {
        try {
          const res = await fetch('/api/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productIds, source }),
          })
          if (!res.ok) throw new Error()
          return
        } catch {
          setRemote(false)
        }
      }
      writeLocal(next)
    },
    [items, remote, userId]
  )

  const removeProduct = useCallback(
    async (productId: string) => {
      const next = items.filter(item => item.productId !== productId)
      setItems(next)

      if (remote) {
        try {
          const res = await fetch(`/api/catalog?userId=${userId}&productId=${productId}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error()
          return
        } catch {
          setRemote(false)
        }
      }
      writeLocal(next)
    },
    [items, remote, userId]
  )

  const runBuilder = useCallback(
    async (prompt: string): Promise<{ summary: string; added: number }> => {
      if (remote) {
        try {
          const res = await fetch('/api/catalog/build', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, prompt }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          const next = mergeItems(items, toItems(data.productIds, 'ai_builder'))
          setItems(next)
          return { summary: data.summary, added: data.productIds.length }
        } catch {
          setRemote(false)
        }
      }

      // Offline path: same deterministic builder, run locally.
      const result: BuilderResult = buildCatalog(parseBuilderPrompt(prompt))
      const next = mergeItems(items, toItems(result.products.map(product => product.id), 'ai_builder'))
      setItems(next)
      writeLocal(next)
      return { summary: result.summary, added: result.products.length }
    },
    [items, remote, userId]
  )

  const products = items
    .map(item => getProduct(item.productId))
    .filter((product): product is CatalogProduct => Boolean(product))

  return {
    items,
    products,
    productIds: new Set(items.map(item => item.productId)),
    loading,
    addProducts,
    removeProduct,
    runBuilder,
  }
}
