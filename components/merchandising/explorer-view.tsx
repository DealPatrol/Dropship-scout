'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { marginPercent, NICHES, PRODUCTS } from '@/lib/merchandising/data'
import { opportunityScore } from '@/lib/merchandising/scoring'
import { matchesTimingFilter, TIMING_FILTERS } from '@/lib/merchandising/seasonal'
import { useCatalog } from '@/lib/merchandising/use-catalog'
import type { CatalogProduct, NicheId, TimingFilterId } from '@/lib/merchandising/types'
import { Button } from '@/components/ui/button'
import { DiscoveryCard } from '@/components/merchandising/discovery-card'
import { useToast } from '@/components/ui/toaster'
import { Layers, ShoppingBag, SlidersHorizontal, Store } from 'lucide-react'

type SortId = 'opportunity' | 'margin' | 'orders' | 'price_low' | 'competition'

const SORTS: { id: SortId; label: string }[] = [
  { id: 'opportunity', label: 'Highest Opportunity' },
  { id: 'margin', label: 'Highest Margin' },
  { id: 'orders', label: 'Best Selling' },
  { id: 'price_low', label: 'Lowest Price' },
  { id: 'competition', label: 'Lowest Competition' },
]

const QUICK_FILTERS = [
  { id: 'high_margin', label: 'High Margin (55%+)' },
  { id: 'low_competition', label: 'Low Competition' },
  { id: 'fast_shipping', label: 'Fast Shipping' },
  { id: 'under_25', label: 'Under $25' },
  { id: 'impulse', label: 'Impulse Buys' },
  { id: 'evergreen', label: 'Evergreen' },
  { id: 'seasonal', label: 'Seasonal' },
] as const

type QuickFilterId = (typeof QUICK_FILTERS)[number]['id']

const COMPETITION_RANK: Record<CatalogProduct['competition'], number> = { Low: 0, Medium: 1, High: 2 }

function matchesQuickFilter(product: CatalogProduct, filter: QuickFilterId): boolean {
  switch (filter) {
    case 'high_margin':
      return marginPercent(product) >= 55
    case 'low_competition':
      return product.competition === 'Low'
    case 'fast_shipping':
      return product.shippingDays <= 8
    case 'under_25':
      return product.price < 25
    case 'impulse':
      return product.impulse
    case 'evergreen':
      return product.seasonality === 'evergreen'
    case 'seasonal':
      return product.seasonality === 'seasonal'
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function ExplorerView({ userId }: { userId: string }) {
  const catalog = useCatalog(userId)
  const { toast } = useToast()
  const [niche, setNiche] = useState<NicheId | 'all'>('all')
  const [timing, setTiming] = useState<TimingFilterId | 'all'>('all')
  const [multiNicheOnly, setMultiNicheOnly] = useState(false)
  const [quickFilters, setQuickFilters] = useState<Set<QuickFilterId>>(new Set())
  const [sort, setSort] = useState<SortId>('opportunity')
  const [pushingId, setPushingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter(product => {
      if (niche !== 'all' && !product.niches.includes(niche)) return false
      if (timing !== 'all' && !matchesTimingFilter(product, timing)) return false
      if (multiNicheOnly && product.niches.length < 2) return false
      for (const filter of Array.from(quickFilters)) {
        if (!matchesQuickFilter(product, filter)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'opportunity':
          return opportunityScore(b).total - opportunityScore(a).total
        case 'margin':
          return marginPercent(b) - marginPercent(a)
        case 'orders':
          return b.monthlyOrders - a.monthlyOrders
        case 'price_low':
          return a.price - b.price
        case 'competition':
          return COMPETITION_RANK[a.competition] - COMPETITION_RANK[b.competition]
        default: {
          const _exhaustive: never = sort
          return _exhaustive
        }
      }
    })

    return list
  }, [niche, timing, multiNicheOnly, quickFilters, sort])

  function toggleQuickFilter(id: QuickFilterId) {
    setQuickFilters(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAdd(product: CatalogProduct) {
    await catalog.addProducts([product.id])
    toast({ title: 'Added to catalog', description: product.name })
  }

  async function handleSell(product: CatalogProduct) {
    if (!catalog.shopifyDomain) {
      toast({
        title: 'No store connected',
        description: 'Add your Shopify domain and access token in Settings first.',
        variant: 'destructive',
      })
      return
    }
    setPushingId(product.id)
    try {
      const result = await catalog.pushToStore([product.id])
      if (result.error || result.pushed === 0) {
        toast({ title: 'Push failed', description: result.error || 'Could not list the product.', variant: 'destructive' })
      } else {
        toast({ title: 'Live on your store 🎉', description: `${product.name} is now listed on ${catalog.shopifyDomain}` })
      }
    } finally {
      setPushingId(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Product Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top 10 best sellers across 10 niches, scored and timed — build your catalog with one click
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-md px-3 py-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="text-foreground font-medium">{catalog.products.length}</span> in catalog
          </div>
          <div className="flex items-center gap-2 text-sm bg-card border border-border rounded-md px-3 py-2">
            <Store className={cn('h-4 w-4', catalog.shopifyDomain ? 'text-green-400' : 'text-muted-foreground')} />
            {catalog.shopifyDomain ? (
              <span className="text-foreground font-medium">{catalog.shopifyDomain}</span>
            ) : (
              <Link href="/dashboard/settings" className="text-primary hover:underline">
                Connect your store
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Niche selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setNiche('all')}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
            niche === 'all'
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
          )}
        >
          All Niches
        </button>
        {NICHES.map(n => (
          <button
            key={n.id}
            onClick={() => setNiche(niche === n.id ? 'all' : n.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
              niche === n.id
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {n.emoji} {n.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-border bg-card p-4 mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMultiNicheOnly(!multiNicheOnly)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5',
              multiNicheOnly
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            <Layers className="h-3 w-3" />
            Multi-Niche Winners ⭐
          </button>
          {QUICK_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => toggleQuickFilter(filter.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                quickFilters.has(filter.id)
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="timing" className="text-xs text-muted-foreground">When to sell</label>
            <select
              id="timing"
              value={timing}
              onChange={e => setTiming(e.target.value as TimingFilterId | 'all')}
              className="h-9 rounded-md border border-input bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Any time</option>
              {TIMING_FILTERS.map(f => (
                <option key={f.id} value={f.id}>{f.emoji} {f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="sort" className="text-xs text-muted-foreground">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={e => setSort(e.target.value as SortId)}
              className="h-9 rounded-md border border-input bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SORTS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto self-end">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const ids = filtered.slice(0, 10).map(product => product.id)
                await catalog.addProducts(ids)
                toast({ title: 'Added top 10 to catalog', description: `${ids.length} products added` })
              }}
            >
              + Add Top 10 to Catalog
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing <span className="text-foreground font-medium">{filtered.length}</span> products
        {niche !== 'all' && <> in <span className="text-foreground font-medium">{NICHES.find(n => n.id === niche)?.label}</span></>}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(product => (
          <DiscoveryCard
            key={product.id}
            product={product}
            inCatalog={catalog.productIds.has(product.id)}
            isPushed={catalog.pushedIds.has(product.id)}
            isPushing={pushingId === product.id}
            onAdd={() => handleAdd(product)}
            onRemove={() => catalog.removeProduct(product.id)}
            onSell={() => handleSell(product)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h3 className="text-base font-medium text-foreground">No products match those filters</h3>
          <p className="text-sm text-muted-foreground mt-1">Try removing a filter or two</p>
        </div>
      )}
    </div>
  )
}
