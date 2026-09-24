'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSavedProducts, deleteSavedProduct, pushToShopify, getShopifyDomain } from '@/lib/api'
import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  Loader2,
  Trash2,
  Send,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

const trendColors: Record<string, string> = {
  '🔥 Hot': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  '📈 Rising': 'text-green-400 bg-green-400/10 border-green-400/20',
  '✅ Stable': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  '⚡ Viral': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
}

const competitionColors: Record<string, string> = {
  Low: 'text-green-400',
  Medium: 'text-yellow-400',
  High: 'text-red-400',
}

interface SavedProductsViewProps {
  userId: string
}

export function SavedProductsView({ userId }: SavedProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pushing, setPushing] = useState(false)
  const [pushResult, setPushResult] = useState<{ pushed: number; total: number } | null>(null)
  const [shopifyDomain, setShopifyDomain] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prods, domain] = await Promise.all([
        getSavedProducts(userId),
        getShopifyDomain(userId),
      ])
      setProducts(prods)
      setShopifyDomain(domain)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteSavedProduct(userId, id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handlePush() {
    if (!shopifyDomain || selected.size === 0) return
    setPushing(true)
    setPushResult(null)
    const selectedProducts = products.filter(p => p.id && selected.has(p.id))
    try {
      const result = await pushToShopify({
        domain: shopifyDomain,
        token: '',
        products: selectedProducts,
        userId,
      })
      setPushResult({ pushed: result.pushed, total: result.total })
    } catch {
      // ignore
    } finally {
      setPushing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-7 bg-surface-raised rounded w-44 animate-pulse mb-2" />
          <div className="h-4 bg-surface-raised rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 animate-pulse">
              <div className="h-4 bg-surface-raised rounded w-3/4" />
              <div className="h-3 bg-surface-raised rounded w-1/2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-surface-raised rounded" />
                <div className="h-10 bg-surface-raised rounded" />
              </div>
              <div className="h-9 bg-surface-raised rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={loadProducts}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Saved Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {selected.size > 0 && shopifyDomain && (
          <Button onClick={handlePush} disabled={pushing} className="gap-2 shrink-0">
            {pushing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Pushing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Push {selected.size} to Shopify
              </>
            )}
          </Button>
        )}

        {!shopifyDomain && selected.size > 0 && (
          <p className="text-xs text-muted-foreground">
            Connect Shopify in Settings to push products
          </p>
        )}
      </div>

      {pushResult && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-md px-4 py-2">
          <CheckCircle className="h-4 w-4" />
          Pushed {pushResult.pushed} of {pushResult.total} products to Shopify
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium text-foreground">No saved products</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Search for products and save the ones you want to sell
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => {
            const id = product.id!
            const isSelected = selected.has(id)
            const margin = typeof product.margin === 'number' ? product.margin : parseFloat(String(product.margin))
            const score = typeof product.score === 'number' ? product.score : parseFloat(String(product.score))

            return (
              <article
                key={id}
                className={cn(
                  'rounded-lg border bg-card flex flex-col overflow-hidden transition-colors cursor-pointer',
                  isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/30'
                )}
                onClick={() => toggleSelect(id)}
              >
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <span className={cn(
                      'shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium',
                      trendColors[product.trend] ?? 'text-muted-foreground border-border bg-transparent'
                    )}>
                      {product.trend}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">{product.category}</p>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-surface-raised rounded-md p-2">
                      <p className="text-xs text-muted-foreground mb-0.5">Sell Price</p>
                      <p className="text-sm font-semibold text-foreground">${product.sellPrice}</p>
                    </div>
                    <div className="bg-surface-raised rounded-md p-2">
                      <p className="text-xs text-muted-foreground mb-0.5">Margin</p>
                      <p className={cn('text-sm font-semibold', margin >= 40 ? 'text-green-400' : 'text-foreground')}>
                        {margin}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span>{product.rating}</span>
                    <span className="mx-1">·</span>
                    <TrendingUp className="h-3 w-3" />
                    <span className={cn('font-medium', competitionColors[product.competition])}>
                      {product.competition}
                    </span>
                    <span>competition</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1">
                    {product.aiInsight}
                  </p>

                  <p className="text-xs text-muted-foreground mt-auto pt-2">
                    Score: <span className="text-foreground font-medium">{score.toFixed(1)}/10</span>
                  </p>
                </div>

                <div className="p-3 border-t border-border flex items-center gap-2">
                  <div className="flex-1 text-xs text-muted-foreground">
                    {isSelected ? (
                      <span className="text-primary font-medium">Selected for push</span>
                    ) : (
                      'Click to select'
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === id}
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(id)
                    }}
                    aria-label="Delete product"
                  >
                    {deletingId === id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
