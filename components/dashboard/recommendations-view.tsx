'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRecommendations, saveProduct } from '@/lib/api'
import type { Product } from '@/lib/types'
import { ProductCard } from '@/components/dashboard/product-card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface RecommendationsViewProps {
  userId: string
}

export function RecommendationsView({ userId }: RecommendationsViewProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const recs = await getRecommendations(userId, 8)
      setProducts(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  async function handleSave(product: Product) {
    const key = product.name
    setSavingIds(prev => new Set([...prev, key]))
    try {
      await saveProduct(userId, product)
      setSavedIds(prev => new Set([...prev, key]))
    } catch {
      // silently ignore
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-curated picks based on your saved products and search history
          </p>
        </div>

        {!loading && !error && (
          <Button variant="outline" size="sm" onClick={fetchRecommendations} className="gap-2 shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 animate-pulse">
              <div className="h-4 bg-surface-raised rounded w-3/4" />
              <div className="h-3 bg-surface-raised rounded w-1/2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-surface-raised rounded" />
                <div className="h-12 bg-surface-raised rounded" />
              </div>
              <div className="h-3 bg-surface-raised rounded w-full" />
              <div className="h-3 bg-surface-raised rounded w-4/5" />
              <div className="h-9 bg-surface-raised rounded mt-1" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive text-center max-w-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRecommendations} className="gap-2">
            <Loader2 className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Sparkles className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-base font-medium text-foreground">No recommendations yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Save some products or run a search first — recommendations are personalised from your history.
          </p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <ProductCard
              key={`${product.name}-${i}`}
              product={product}
              isSaved={savedIds.has(product.name)}
              isSaving={savingIds.has(product.name)}
              onSave={() => handleSave(product)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
