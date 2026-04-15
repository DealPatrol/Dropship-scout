'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { searchProducts, saveProduct } from '@/lib/api'
import type { Product, SupplierPlatform } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductCard } from '@/components/dashboard/product-card'
import {
  Search,
  Loader2,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'

const PLATFORMS: { id: SupplierPlatform; label: string }[] = [
  { id: 'aliexpress', label: 'AliExpress' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'temu', label: 'Temu' },
  { id: 'walmart', label: 'Walmart' },
  { id: 'ebay', label: 'eBay' },
  { id: 'cjdropship', label: 'CJDropship' },
  { id: 'spocket', label: 'Spocket' },
  { id: 'zendrop', label: 'Zendrop' },
]

const CATEGORIES = [
  'All Categories',
  'Electronics',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Toys & Games',
  'Fashion & Apparel',
  'Pet Supplies',
  'Health & Wellness',
  'Baby & Kids',
  'Garden & Outdoor',
]

const SORT_OPTIONS = [
  'Best Selling',
  'Highest Margin',
  'Lowest Competition',
  'Trending',
  'New Arrivals',
]

interface SearchViewProps {
  userId: string
}

export function SearchView({ userId }: SearchViewProps) {
  const [platforms, setPlatforms] = useState<SupplierPlatform[]>(['aliexpress'])
  const [category, setCategory] = useState('All Categories')
  const [sortBy, setSortBy] = useState('Best Selling')
  const [customNiche, setCustomNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  function togglePlatform(id: SupplierPlatform) {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!platforms.length) {
      setError('Select at least one platform')
      return
    }
    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const results = await searchProducts({ platforms, category, sortBy, customNiche, userId })
      setProducts(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(product: Product) {
    const key = product.name
    setSavingId(key)
    try {
      await saveProduct(userId, product)
      setSavedIds(prev => new Set([...prev, key]))
    } catch {
      // silently fail — user will see unsaved state
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Product Research</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered search across top dropshipping platforms
        </p>
      </div>

      {/* Search form */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col gap-5">
            {/* Platform toggles */}
            <div className="flex flex-col gap-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                      platforms.includes(p.id)
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category + Sort + Niche */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sort">Sort by</Label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SORT_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="niche">Custom Niche (optional)</Label>
                <Input
                  id="niche"
                  placeholder="e.g., pet accessories, fitness"
                  value={customNiche}
                  onChange={e => setCustomNiche(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} size="lg" className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Find Products
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && searched && products.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium text-foreground">No results</h3>
          <p className="text-sm text-muted-foreground mt-1">Try different filters or platforms</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Found <span className="text-foreground font-medium">{products.length}</span> products
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <ProductCard
                key={`${product.name}-${i}`}
                product={product}
                isSaved={savedIds.has(product.name)}
                isSaving={savingId === product.name}
                onSave={() => handleSave(product)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-4 bg-surface-raised rounded w-3/4" />
      <div className="h-3 bg-surface-raised rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-5 bg-surface-raised rounded-full w-16" />
        <div className="h-5 bg-surface-raised rounded-full w-14" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="h-10 bg-surface-raised rounded" />
        <div className="h-10 bg-surface-raised rounded" />
      </div>
      <div className="h-3 bg-surface-raised rounded w-full" />
      <div className="h-3 bg-surface-raised rounded w-5/6" />
      <div className="h-9 bg-surface-raised rounded mt-1" />
    </div>
  )
}
