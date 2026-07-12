'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { marginPercent, NICHE_MAP, HOLIDAY_MAP } from '@/lib/merchandising/data'
import { opportunityScore, revenueImpact } from '@/lib/merchandising/scoring'
import {
  demandForMonth,
  demandGlyph,
  MONTH_LABELS,
  peakMonth,
  sellingWindowLabel,
  stockByMonth,
} from '@/lib/merchandising/seasonal'
import { bundleSuggestions, bundleValue } from '@/lib/merchandising/bundles'
import { useCatalog } from '@/lib/merchandising/use-catalog'
import type { CatalogProduct } from '@/lib/merchandising/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreBar, ScoreRing } from '@/components/merchandising/score-badge'
import { useToast } from '@/components/ui/toaster'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  DollarSign,
  Package,
  Plus,
  Sparkles,
  Truck,
} from 'lucide-react'

const BREAKDOWN_LABELS: Record<string, string> = {
  demand: 'Demand',
  competition: 'Competition',
  margin: 'Profit Margin',
  supplierQuality: 'Supplier Quality',
  trendStability: 'Trend Stability',
  trendDirection: 'Trend Direction',
}

export function ProductDetailView({ product, userId }: { product: CatalogProduct; userId: string }) {
  const catalog = useCatalog(userId)
  const { toast } = useToast()
  const score = opportunityScore(product)
  const impact = revenueImpact(product)
  const bundles = bundleSuggestions(product)
  const bundle = bundleValue(product, bundles)
  const margin = marginPercent(product)
  const inCatalog = catalog.productIds.has(product.id)
  const peak = peakMonth(product)
  const stockBy = stockByMonth(product)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href="/dashboard/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Explorer
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {product.niches.map(nicheId => (
              <span key={nicheId} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {NICHE_MAP[nicheId].emoji} {NICHE_MAP[nicheId].label}
              </span>
            ))}
            {product.niches.length >= 2 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                ⭐ Appears in {product.niches.length} niches
              </span>
            )}
          </div>
        </div>
        {inCatalog ? (
          <Button variant="secondary" className="gap-2" onClick={() => catalog.removeProduct(product.id)}>
            <Check className="h-4 w-4 text-green-400" />
            In Catalog — Remove
          </Button>
        ) : (
          <Button
            className="gap-2"
            onClick={async () => {
              await catalog.addProducts([product.id])
              toast({ title: 'Added to catalog', description: product.name })
            }}
          >
            <Plus className="h-4 w-4" />
            Add to Catalog
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Opportunity score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Opportunity Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ScoreRing score={score.total} />
            <div className="w-full flex flex-col gap-2">
              {Object.entries(score.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-28 shrink-0">{BREAKDOWN_LABELS[key]}</span>
                  <ScoreBar score={value} className="flex-1" />
                  <span className="text-xs font-medium text-foreground w-7 text-right tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Why this product */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Why This Product?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {score.reasons.map(reason => (
                <li key={reason} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  {reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Revenue impact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              Potential Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-3xl font-bold text-green-400">
                +${impact.monthlyRevenue.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated {impact.monthlyUnitsLow}–{impact.monthlyUnitsHigh} units/month
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                impact.confidence === 'High' ? 'bg-green-400/10 text-green-400' :
                impact.confidence === 'Medium' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'
              )}>
                {impact.confidence}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{impact.why}</p>
            <div className="border-t border-border pt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Sell / Cost</p>
                <p className="font-semibold text-foreground">${product.price.toFixed(2)} / ${product.cost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margin</p>
                <p className="font-semibold text-green-400">{margin}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Timing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              When to Sell
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Best Time</p>
                <p className="font-semibold text-foreground">{sellingWindowLabel(product)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peak Sales</p>
                <p className="font-semibold text-foreground">{peak ? MONTH_LABELS[peak - 1] : 'Consistent'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock By</p>
                <p className="font-semibold text-foreground">{stockBy ? MONTH_LABELS[stockBy - 1] : 'Anytime'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-semibold text-foreground capitalize">{product.seasonality}</p>
              </div>
            </div>

            {/* 12-month demand strip */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Demand by month</p>
              <div className="grid grid-cols-12 gap-1">
                {MONTH_LABELS.map((label, i) => {
                  const level = demandForMonth(product, i + 1)
                  return (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          'text-sm',
                          level === 3 ? 'text-primary' : level === 2 ? 'text-green-400' : level === 1 ? 'text-yellow-400' : 'text-muted-foreground/40'
                        )}
                        title={`${label}: ${['Low', 'Moderate', 'Strong', 'Peak'][level]} demand`}
                      >
                        {demandGlyph(level)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{label[0]}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">★ Peak · ✔ Strong · △ Moderate · ○ Low</p>
            </div>

            {product.holidays.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.holidays.map(id => (
                  <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {HOLIDAY_MAP[id].emoji} {HOLIDAY_MAP[id].label}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suppliers & audience */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Suppliers & Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Suppliers</p>
                <p className="font-semibold text-foreground">{product.supplierCount} available</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Shipping</p>
                <p className="font-semibold text-foreground">{product.shippingDays} days</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="font-semibold text-foreground">⭐ {product.rating.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Ad Platform</p>
                <p className="font-semibold text-foreground">{product.adPlatform}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.suppliers.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                  {s}
                </span>
              ))}
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Target Audience</p>
              <p className="text-foreground mt-0.5">{product.audience}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bundles */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Bundle Suggestions
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              3-item bundle ≈ <span className="text-foreground font-semibold">${bundle.bundlePrice.toFixed(2)}</span>
              {' · '}est. AOV lift <span className="text-green-400 font-semibold">+{bundle.aovLiftPercent}%</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bundles.map(({ product: partner, reason }) => {
              const partnerInCatalog = catalog.productIds.has(partner.id)
              return (
                <div key={partner.id} className="rounded-md border border-border bg-surface-raised p-3 flex flex-col gap-2">
                  <Link
                    href={`/dashboard/explore/${partner.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {partner.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{reason}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-semibold text-foreground">${partner.price.toFixed(2)}</span>
                    <Button
                      variant={partnerInCatalog ? 'secondary' : 'outline'}
                      size="sm"
                      disabled={partnerInCatalog}
                      onClick={async () => {
                        await catalog.addProducts([partner.id], 'suggestion')
                        toast({ title: 'Added to catalog', description: partner.name })
                      }}
                    >
                      {partnerInCatalog ? 'In Catalog' : '+ Add'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
