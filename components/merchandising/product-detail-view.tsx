'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { marginPercent, NICHE_MAP, HOLIDAY_MAP } from '@/lib/merchandising/data'
import { opportunityScore, revenueImpact } from '@/lib/merchandising/scoring'
import { dropshipEconomics, supplierSources } from '@/lib/merchandising/fulfillment'
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
  ExternalLink,
  Loader2,
  Package,
  Plus,
  Sparkles,
  Store,
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
  const [pushing, setPushing] = useState(false)
  const score = opportunityScore(product)
  const impact = revenueImpact(product)
  const bundles = bundleSuggestions(product)
  const bundle = bundleValue(product, bundles)
  const margin = marginPercent(product)
  const inCatalog = catalog.productIds.has(product.id)
  const isPushed = catalog.pushedIds.has(product.id)
  const peak = peakMonth(product)
  const stockBy = stockByMonth(product)
  const economics = dropshipEconomics(product)
  const sources = supplierSources(product)

  async function handleSell() {
    if (!catalog.shopifyDomain) {
      toast({
        title: 'No store connected',
        description: 'Add your Shopify domain and access token in Settings first.',
        variant: 'destructive',
      })
      return
    }
    setPushing(true)
    try {
      const result = await catalog.pushToStore([product.id])
      if (result.error || result.pushed === 0) {
        toast({ title: 'Push failed', description: result.error || 'Could not list the product.', variant: 'destructive' })
      } else {
        toast({ title: 'Live on your store 🎉', description: `${product.name} is now listed on ${catalog.shopifyDomain}` })
      }
    } finally {
      setPushing(false)
    }
  }

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
        <div className="flex items-center gap-2">
          {inCatalog ? (
            <Button variant="secondary" className="gap-2" onClick={() => catalog.removeProduct(product.id)}>
              <Check className="h-4 w-4 text-green-400" />
              In Catalog — Remove
            </Button>
          ) : (
            <Button
              variant="outline"
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
          {isPushed ? (
            <Button variant="secondary" className="gap-2" disabled>
              <Check className="h-4 w-4 text-green-400" />
              Live on Your Store
            </Button>
          ) : (
            <Button className="gap-2" onClick={handleSell} disabled={pushing}>
              {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
              Sell on My Store
            </Button>
          )}
        </div>
      </div>

      {/* Sell this on your store — dropshipping economics */}
      <Card className="mb-4 border-green-400/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-green-400" />
              Sell This on Your Store
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {catalog.shopifyDomain ? (
                <>Connected to <span className="text-foreground font-medium">{catalog.shopifyDomain}</span></>
              ) : (
                <Link href="/dashboard/settings" className="text-primary hover:underline">
                  Connect your Shopify store in Settings →
                </Link>
              )}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Per-sale money flow */}
            <div className="rounded-md bg-surface-raised p-4 flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Every time a customer buys</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Customer pays you</span>
                <span className="font-semibold text-foreground tabular-nums">${economics.perSale.sellPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You order from supplier</span>
                <span className="font-semibold text-foreground tabular-nums">−${economics.perSale.supplierCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment fees (est.)</span>
                <span className="font-semibold text-foreground tabular-nums">−${economics.perSale.fees.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-1">
                <span className="text-foreground font-medium">You keep</span>
                <span className="font-bold text-green-400 tabular-nums">
                  ${economics.perSale.profit.toFixed(2)} ({economics.perSale.marginPercent}%)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Est. <span className="text-green-400 font-medium">${economics.monthlyProfit.toLocaleString()}/mo profit</span> at{' '}
                {economics.monthlyUnitsLow}–{economics.monthlyUnitsHigh} sales/month
              </p>
            </div>

            {/* How fulfillment works */}
            <div className="rounded-md bg-surface-raised p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">How fulfillment works</p>
              <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">1.</span>
                  A customer orders on your store at ${economics.perSale.sellPrice.toFixed(2)} — you never hold inventory.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">2.</span>
                  You place the order with a supplier below at ~${economics.perSale.supplierCost.toFixed(2)}, entering the customer&apos;s shipping address.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">3.</span>
                  The supplier ships directly to your customer. The difference is your profit.
                </li>
              </ol>
            </div>

            {/* Supplier order links */}
            <div className="rounded-md bg-surface-raised p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Order from these suppliers</p>
              <div className="flex flex-col gap-2">
                {sources.map(source => (
                  <a
                    key={source.platform}
                    href={source.orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:border-primary/40 transition-colors group"
                  >
                    <span className="text-foreground font-medium">{source.label}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {source.shippingDays}
                      <ExternalLink className="h-3 w-3 group-hover:text-primary transition-colors" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
