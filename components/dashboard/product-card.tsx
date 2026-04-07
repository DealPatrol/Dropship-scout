'use client'

import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Bookmark, BookmarkCheck, Loader2, Star, TrendingUp } from 'lucide-react'

interface ProductCardProps {
  product: Product
  isSaved: boolean
  isSaving: boolean
  onSave: () => void
}

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

export function ProductCard({ product, isSaved, isSaving, onSave }: ProductCardProps) {
  const margin = typeof product.margin === 'number' ? product.margin : parseFloat(String(product.margin))
  const score = typeof product.score === 'number' ? product.score : parseFloat(String(product.score))
  const scorePercent = Math.min(100, (score / 10) * 100)

  return (
    <article className="rounded-lg border border-border bg-card flex flex-col gap-0 overflow-hidden hover:border-primary/30 transition-colors animate-fade-in">
      {/* Header */}
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

        {/* Score bar */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground">{score.toFixed(1)}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-surface-raised rounded-md p-2">
            <p className="text-xs text-muted-foreground mb-0.5">Sell Price</p>
            <p className="text-sm font-semibold text-foreground">${product.sellPrice}</p>
          </div>
          <div className="bg-surface-raised rounded-md p-2">
            <p className="text-xs text-muted-foreground mb-0.5">Margin</p>
            <p className={cn('text-sm font-semibold', margin >= 40 ? 'text-green-400' : margin >= 25 ? 'text-yellow-400' : 'text-foreground')}>
              {margin}%
            </p>
          </div>
          <div className="bg-surface-raised rounded-md p-2">
            <p className="text-xs text-muted-foreground mb-0.5">Monthly Sales</p>
            <p className="text-sm font-semibold text-foreground">{product.monthlySales}</p>
          </div>
          <div className="bg-surface-raised rounded-md p-2">
            <p className="text-xs text-muted-foreground mb-0.5">Competition</p>
            <p className={cn('text-sm font-semibold', competitionColors[product.competition])}>
              {product.competition}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
          <span>{product.rating}</span>
          <span className="mx-1">·</span>
          <TrendingUp className="h-3 w-3" />
          <span>${product.sourcePrice} source</span>
        </div>

        {/* AI Insight */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 border-t border-border pt-3 mt-1">
          {product.aiInsight}
        </p>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Button
          onClick={onSave}
          disabled={isSaved || isSaving}
          variant={isSaved ? 'secondary' : 'default'}
          size="sm"
          className="w-full gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <BookmarkCheck className="h-3.5 w-3.5" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-3.5 w-3.5" />
              Save Product
            </>
          )}
        </Button>
      </div>
    </article>
  )
}
