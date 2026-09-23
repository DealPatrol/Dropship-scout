'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PRODUCTS } from '@/lib/merchandising/data'
import { opportunityScore } from '@/lib/merchandising/scoring'
import {
  demandForMonth,
  demandGlyph,
  matchesTimingFilter,
  MONTH_LABELS,
  peakMonth,
  sellingWindowLabel,
  stockByMonth,
  TIMING_FILTERS,
  upcomingHolidays,
} from '@/lib/merchandising/seasonal'
import { useCatalog } from '@/lib/merchandising/use-catalog'
import type { TimingFilterId } from '@/lib/merchandising/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toaster'
import { CalendarDays, Sparkles } from 'lucide-react'

export function PlannerView({ userId }: { userId: string }) {
  const catalog = useCatalog(userId)
  const { toast } = useToast()
  const [filter, setFilter] = useState<TimingFilterId>('this_month')

  const now = useMemo(() => new Date(), [])
  const currentMonth = now.getMonth() + 1

  const matching = useMemo(
    () =>
      PRODUCTS.filter(product => matchesTimingFilter(product, filter, now)).sort(
        (a, b) => opportunityScore(b).total - opportunityScore(a).total
      ),
    [filter, now]
  )

  // Stock-ahead recommendations: seasonal products whose stock-by month is
  // now or next month, so merchants order before demand hits.
  const stockNow = useMemo(() => {
    return PRODUCTS.filter(product => {
      const stockBy = stockByMonth(product)
      if (stockBy === null) return false
      const distance = (stockBy - currentMonth + 12) % 12
      return distance <= 1
    }).sort((a, b) => opportunityScore(b).total - opportunityScore(a).total)
  }, [currentMonth])

  const holidays = useMemo(() => upcomingHolidays(PRODUCTS, now, 3), [now])

  const seasonalRows = useMemo(
    () =>
      PRODUCTS.filter(product => product.peakMonths.length > 0).sort(
        (a, b) => (peakMonth(a) ?? 0) - (peakMonth(b) ?? 0)
      ),
    []
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Seasonal Demand Planner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Know what to sell now, what to stock next, and when every product peaks
        </p>
      </div>

      {/* AI recommendations for right now */}
      <Card className="mb-6 border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            It&apos;s {now.toLocaleString('en-US', { month: 'long' })} — stock these now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Suppliers need lead time. These products&apos; selling windows open within ~2 months — order now to launch before competitors.
          </p>
          <div className="flex flex-col gap-2">
            {stockNow.slice(0, 6).map(product => {
              const stockBy = stockByMonth(product)
              const inCatalog = catalog.productIds.has(product.id)
              return (
                <div key={product.id} className="flex flex-wrap items-center gap-3 rounded-md bg-surface-raised px-3 py-2">
                  <Link href={`/dashboard/explore/${product.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {product.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    Sells {sellingWindowLabel(product)} · stock by {stockBy ? MONTH_LABELS[stockBy - 1] : '—'}
                  </span>
                  <div className="ml-auto">
                    <Button
                      variant={inCatalog ? 'secondary' : 'outline'}
                      size="sm"
                      disabled={inCatalog}
                      onClick={async () => {
                        await catalog.addProducts([product.id], 'suggestion')
                        toast({ title: 'Added to catalog', description: product.name })
                      }}
                    >
                      {inCatalog ? 'In Catalog' : '+ Add'}
                    </Button>
                  </div>
                </div>
              )
            })}
            {stockNow.length === 0 && (
              <p className="text-sm text-muted-foreground">No urgent stocking windows right now — check back next month.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming holidays */}
      {holidays.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {holidays.map(({ holiday, products }) => (
            <Card key={holiday.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {holiday.emoji} {holiday.label}
                  <span className="text-xs font-normal text-muted-foreground ml-2">{MONTH_LABELS[holiday.month - 1]}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                {products.slice(0, 4).map(product => (
                  <Link
                    key={product.id}
                    href={`/dashboard/explore/${product.id}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    · {product.name}
                  </Link>
                ))}
                {products.length === 0 && (
                  <p className="text-xs text-muted-foreground">No matching products in the catalog data yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Timing filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TIMING_FILTERS.map(timingFilter => (
          <button
            key={timingFilter.id}
            onClick={() => setFilter(timingFilter.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
              filter === timingFilter.id
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {timingFilter.emoji} {timingFilter.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        <span className="text-foreground font-medium">{matching.length}</span> products match{' '}
        <span className="text-foreground font-medium">{TIMING_FILTERS.find(f => f.id === filter)?.label}</span>
      </p>

      {/* Seasonal calendar table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Demand Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 pr-3 font-medium">Product</th>
                {MONTH_LABELS.map((label, i) => (
                  <th
                    key={label}
                    className={cn('pb-2 px-1 font-medium text-center', i + 1 === currentMonth && 'text-primary')}
                  >
                    {label}
                  </th>
                ))}
                <th className="pb-2 pl-3 font-medium whitespace-nowrap">Stock By</th>
              </tr>
            </thead>
            <tbody>
              {(matching.length > 0 ? matching : seasonalRows)
                .slice(0, 20)
                .map(product => {
                  const stockBy = stockByMonth(product)
                  return (
                    <tr key={product.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <Link href={`/dashboard/explore/${product.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {product.name}
                        </Link>
                      </td>
                      {MONTH_LABELS.map((label, i) => {
                        const level = demandForMonth(product, i + 1)
                        return (
                          <td
                            key={label}
                            className={cn(
                              'py-2 px-1 text-center',
                              level === 3 ? 'text-primary' : level === 2 ? 'text-green-400' : level === 1 ? 'text-yellow-400' : 'text-muted-foreground/30',
                              i + 1 === currentMonth && 'bg-primary/5'
                            )}
                            title={`${label}: ${['Low', 'Moderate', 'Strong', 'Peak'][level]} demand`}
                          >
                            {demandGlyph(level)}
                          </td>
                        )
                      })}
                      <td className="py-2 pl-3 text-muted-foreground whitespace-nowrap">
                        {stockBy ? MONTH_LABELS[stockBy - 1] : 'Anytime'}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-3">★ Peak demand · ✔ Strong demand · △ Moderate demand · ○ Low demand</p>
        </CardContent>
      </Card>
    </div>
  )
}
