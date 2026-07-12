'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PRODUCTS } from '@/lib/merchandising/data'
import { catalogScore, opportunityScore, revenueImpact } from '@/lib/merchandising/scoring'
import { missingBundlePartners } from '@/lib/merchandising/bundles'
import { MONTH_LABELS, stockingAlerts } from '@/lib/merchandising/seasonal'
import { useCatalog } from '@/lib/merchandising/use-catalog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreRing } from '@/components/merchandising/score-badge'
import { useToast } from '@/components/ui/toaster'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarDays,
  Compass,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingDown,
} from 'lucide-react'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function OverviewView({ userId, email }: { userId: string; email: string }) {
  const catalog = useCatalog(userId)
  const { toast } = useToast()
  const now = useMemo(() => new Date(), [])
  const month = now.getMonth() + 1

  const score = catalogScore(catalog.products)
  const missing = missingBundlePartners(catalog.products)
  const alerts = stockingAlerts(catalog.products.length > 0 ? catalog.products : PRODUCTS, now)
  const declining = catalog.products.filter(product => product.trend === 'declining')

  // Top opportunities the user hasn't added yet.
  const opportunities = useMemo(
    () =>
      PRODUCTS.filter(product => !catalog.productIds.has(product.id))
        .sort((a, b) => opportunityScore(b).total - opportunityScore(a).total)
        .slice(0, 6),
    [catalog.productIds]
  )

  const potentialRevenue = opportunities
    .slice(0, 3)
    .reduce((sum, product) => sum + revenueImpact(product).monthlyRevenue, 0)

  const tasks: { icon: React.ReactNode; text: string; href: string }[] = []
  if (opportunities.length > 0) {
    tasks.push({
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      text: `Add these ${Math.min(3, opportunities.length)} trending products (est. +$${potentialRevenue.toLocaleString()}/mo)`,
      href: '/dashboard/explore',
    })
  }
  if (missing.length > 0) {
    tasks.push({
      icon: <Package className="h-4 w-4 text-primary" />,
      text: `Create ${missing.length} bundle${missing.length === 1 ? '' : 's'} — partners are missing from your catalog`,
      href: '/dashboard/catalog',
    })
  }
  for (const alert of alerts.slice(0, 2)) {
    tasks.push({
      icon: <CalendarDays className="h-4 w-4 text-yellow-400" />,
      text: alert.message,
      href: `/dashboard/explore/${alert.productId}`,
    })
  }
  if (declining.length > 0) {
    tasks.push({
      icon: <TrendingDown className="h-4 w-4 text-red-400" />,
      text: `Review ${declining.length} declining product${declining.length === 1 ? '' : 's'}: ${declining.map(product => product.name).join(', ')}`,
      href: '/dashboard/catalog',
    })
  }
  if (catalog.products.length === 0) {
    tasks.push({
      icon: <Bot className="h-4 w-4 text-primary" />,
      text: 'Build your first catalog with the AI Catalog Builder',
      href: '/dashboard/catalog',
    })
  }

  const name = email.split('@')[0]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Daily brief header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting()}, <span className="capitalize">{name}</span>.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tasks.length > 0
            ? `Your AI merchandising manager found ${tasks.length} thing${tasks.length === 1 ? '' : 's'} worth doing today.`
            : 'Everything looks balanced — explore new opportunities below.'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Catalog Score</p>
            <p className={cn('text-2xl font-bold', score.total >= 85 ? 'text-green-400' : score.total >= 70 ? 'text-primary' : 'text-yellow-400')}>
              {catalog.products.length > 0 ? `${score.total}/100` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Products in Catalog</p>
            <p className="text-2xl font-bold text-foreground">{catalog.products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Opportunities Found</p>
            <p className="text-2xl font-bold text-foreground">{opportunities.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Est. Revenue Upside</p>
            <p className="text-2xl font-bold text-green-400">+${potentialRevenue.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* AI daily tasks */}
        <Card className="lg:col-span-2 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              AI Daily Brief — {MONTH_LABELS[month - 1]} {now.getDate()}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {tasks.map(task => (
              <Link
                key={task.text}
                href={task.href}
                className="flex items-center gap-3 rounded-md bg-surface-raised px-3 py-2.5 hover:bg-surface-overlay transition-colors group"
              >
                {task.icon}
                <span className="text-sm text-foreground flex-1">{task.text}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No action items today.</p>
            )}
          </CardContent>
        </Card>

        {/* Catalog score ring or empty state */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Catalog Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {catalog.products.length > 0 ? (
              <>
                <ScoreRing score={score.total} size={110} />
                <div className="flex flex-col gap-1 w-full">
                  {score.suggestions.slice(0, 2).map(suggestion => (
                    <p key={suggestion} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0 mt-0.5" />
                      {suggestion}
                    </p>
                  ))}
                </div>
                <Link href="/dashboard/catalog" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}>
                  View Full Breakdown
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No catalog yet — build one in seconds.</p>
                <Link href="/dashboard/catalog" className={buttonVariants({ size: 'sm' })}>
                  Open AI Builder
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's opportunities */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Today&apos;s Top Opportunities
            </CardTitle>
            <Link href="/dashboard/explore" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {opportunities.map(product => {
              const productScore = opportunityScore(product).total
              const impact = revenueImpact(product)
              return (
                <div key={product.id} className="rounded-md border border-border bg-surface-raised p-3 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/explore/${product.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <span className={cn('text-sm font-bold tabular-nums shrink-0', productScore >= 85 ? 'text-green-400' : 'text-primary')}>
                      {productScore}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Est. <span className="text-green-400 font-medium">+${impact.monthlyRevenue.toLocaleString()}/mo</span> · {impact.confidence} confidence
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    onClick={async () => {
                      await catalog.addProducts([product.id], 'suggestion')
                      toast({ title: 'Added to catalog', description: product.name })
                    }}
                  >
                    + Add to Catalog
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/catalog" className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors flex flex-col gap-1.5">
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Build Catalog</span>
          <span className="text-xs text-muted-foreground">Generate a store with AI</span>
        </Link>
        <Link href="/dashboard/explore" className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors flex flex-col gap-1.5">
          <Compass className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Browse Niches</span>
          <span className="text-xs text-muted-foreground">Top 10s across 10 niches</span>
        </Link>
        <Link href="/dashboard/planner" className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors flex flex-col gap-1.5">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Demand Calendar</span>
          <span className="text-xs text-muted-foreground">What to stock and when</span>
        </Link>
        <Link href="/dashboard/search" className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors flex flex-col gap-1.5">
          <Search className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">AI Search</span>
          <span className="text-xs text-muted-foreground">Research live with AI</span>
        </Link>
      </div>
    </div>
  )
}
