'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { marginPercent, NICHE_MAP } from '@/lib/merchandising/data'
import { opportunityScore } from '@/lib/merchandising/scoring'
import { profitPerSale } from '@/lib/merchandising/fulfillment'
import { sellingWindowLabel } from '@/lib/merchandising/seasonal'
import type { CatalogProduct } from '@/lib/merchandising/types'
import { Button } from '@/components/ui/button'
import { ScoreBadge, ScoreBar } from '@/components/merchandising/score-badge'
import { Check, Plus, Layers, CalendarDays, Loader2, Store } from 'lucide-react'

const trendBadges: Record<CatalogProduct['trend'], { label: string; className: string }> = {
  hot: { label: '🔥 Hot', className: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  rising: { label: '📈 Rising', className: 'text-green-400 bg-green-400/10 border-green-400/20' },
  stable: { label: '✅ Stable', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  declining: { label: '📉 Declining', className: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

const competitionColors: Record<CatalogProduct['competition'], string> = {
  Low: 'text-green-400',
  Medium: 'text-yellow-400',
  High: 'text-red-400',
}

interface DiscoveryCardProps {
  product: CatalogProduct
  inCatalog: boolean
  /** Already listed on the user's store */
  isPushed: boolean
  isPushing: boolean
  onAdd: () => void
  onRemove: () => void
  onSell: () => void
}

export function DiscoveryCard({ product, inCatalog, isPushed, isPushing, onAdd, onRemove, onSell }: DiscoveryCardProps) {
  const score = opportunityScore(product).total
  const margin = marginPercent(product)
  const trend = trendBadges[product.trend]
  const perSale = profitPerSale(product)

  return (
    <article className="rounded-lg border border-border bg-card flex flex-col overflow-hidden hover:border-primary/30 transition-colors animate-fade-in">
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/explore/${product.id}`}
            className="text-sm font-semibold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors"
          >
            {product.name}
          </Link>
          <span className={cn('shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium', trend.className)}>
            {trend.label}
          </span>
        </div>

        {/* Niche badges + multi-niche indicator */}
        <div className="flex flex-wrap items-center gap-1">
          {product.niches.map(nicheId => (
            <span key={nicheId} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {NICHE_MAP[nicheId].emoji} {NICHE_MAP[nicheId].label}
            </span>
          ))}
          {product.niches.length >= 2 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {product.niches.length} niches
            </span>
          )}
        </div>

        {/* Opportunity score */}
        <div className="flex items-center gap-2 mt-1">
          <ScoreBar score={score} className="flex-1" />
          <ScoreBadge score={score} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-surface-raised rounded-md p-2">
            <p className="text-xs text-muted-foreground mb-0.5">You Sell At</p>
            <p className="text-sm font-semibold text-foreground">${product.price.toFixed(2)}</p>
          </div>
          <div className="bg-surface-raised rounded-md p-2">
            <p className="text-xs text-muted-foreground mb-0.5">Supplier Cost</p>
            <p className="text-sm font-semibold text-foreground">${product.cost.toFixed(2)}</p>
          </div>
          <div className="bg-surface-raised rounded-md p-2">
            <p className="text-xs text-muted-foreground mb-0.5">Monthly Orders</p>
            <p className="text-sm font-semibold text-foreground">{(product.monthlyOrders / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-surface-raised rounded-md p-2">
            <p className="text-xs text-muted-foreground mb-0.5">Competition</p>
            <p className={cn('text-sm font-semibold', competitionColors[product.competition])}>
              {product.competition}
            </p>
          </div>
        </div>

        {/* Profit per sale */}
        <div className="flex items-center justify-between rounded-md bg-green-400/5 border border-green-400/20 px-2.5 py-1.5">
          <span className="text-xs text-muted-foreground">You keep per sale</span>
          <span className="text-sm font-bold text-green-400">
            ${perSale.profit.toFixed(2)} <span className="text-xs font-medium text-green-400/70">({margin}%)</span>
          </span>
        </div>

        {/* Selling window */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span>
            {product.seasonality === 'evergreen' ? 'Evergreen · sells year-round' : `Seasonal · best ${sellingWindowLabel(product)}`}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border grid grid-cols-2 gap-2">
        {inCatalog ? (
          <Button onClick={onRemove} variant="secondary" size="sm" className="gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-400" />
            In Catalog
          </Button>
        ) : (
          <Button onClick={onAdd} variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add to Catalog
          </Button>
        )}
        {isPushed ? (
          <Button variant="secondary" size="sm" disabled className="gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-400" />
            On Your Store
          </Button>
        ) : (
          <Button onClick={onSell} disabled={isPushing} size="sm" className="gap-1.5">
            {isPushing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Store className="h-3.5 w-3.5" />
            )}
            Sell on My Store
          </Button>
        )}
      </div>
    </article>
  )
}
