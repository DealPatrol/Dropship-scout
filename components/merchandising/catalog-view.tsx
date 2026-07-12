'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { marginPercent, NICHE_MAP } from '@/lib/merchandising/data'
import { opportunityScore, catalogScore, revenueImpact } from '@/lib/merchandising/scoring'
import { missingBundlePartners } from '@/lib/merchandising/bundles'
import { sellingWindowLabel } from '@/lib/merchandising/seasonal'
import { useCatalog } from '@/lib/merchandising/use-catalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreBar, ScoreRing } from '@/components/merchandising/score-badge'
import { useToast } from '@/components/ui/toaster'
import {
  Bot,
  Check,
  Lightbulb,
  Loader2,
  Package,
  ShoppingBag,
  Trash2,
} from 'lucide-react'

const BUILDER_EXAMPLES = [
  'Build me a pet store with 20 winning products',
  'Create a general store with products under $30',
  'Build a catalog with at least 55% profit margin',
  'Find products that fit two or more niches',
]

export function CatalogView({ userId }: { userId: string }) {
  const catalog = useCatalog(userId)
  const { toast } = useToast()
  const [prompt, setPrompt] = useState('')
  const [building, setBuilding] = useState(false)
  const [builderSummary, setBuilderSummary] = useState<string | null>(null)

  const score = catalogScore(catalog.products)
  const missing = missingBundlePartners(catalog.products)

  const nicheCounts = new Map<string, number>()
  for (const product of catalog.products) {
    const primary = product.niches[0]
    nicheCounts.set(primary, (nicheCounts.get(primary) ?? 0) + 1)
  }

  const totalRevenue = catalog.products.reduce((sum, product) => sum + revenueImpact(product).monthlyRevenue, 0)
  const avgMargin = catalog.products.length
    ? Math.round(catalog.products.reduce((sum, product) => sum + marginPercent(product), 0) / catalog.products.length)
    : 0

  async function handleBuild(text: string) {
    if (!text.trim() || building) return
    setBuilding(true)
    setBuilderSummary(null)
    try {
      const result = await catalog.runBuilder(text.trim())
      setBuilderSummary(result.summary)
      toast({ title: 'Catalog built', description: `${result.added} products selected` })
    } finally {
      setBuilding(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">My Store Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {catalog.products.length > 0
            ? `${catalog.products.length} products · ${Array.from(nicheCounts.entries()).map(([id, count]) => `${NICHE_MAP[id as keyof typeof NICHE_MAP]?.label ?? id} (${count})`).join(' · ')}`
            : 'Build your perfect product catalog — by hand or with the AI builder'}
        </p>
      </div>

      {/* AI Catalog Builder */}
      <Card className="mb-6 border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AI Catalog Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={e => {
              e.preventDefault()
              handleBuild(prompt)
            }}
          >
            <Input
              placeholder='e.g. "Build me a pet store with 20 winning products"'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={building || !prompt.trim()} className="gap-2">
              {building ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building...
                </>
              ) : (
                'Build Catalog'
              )}
            </Button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {BUILDER_EXAMPLES.map(example => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setPrompt(example)
                  handleBuild(example)
                }}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
          {builderSummary && (
            <p className="text-sm text-foreground bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
              ✨ {builderSummary}
            </p>
          )}
        </CardContent>
      </Card>

      {catalog.products.length === 0 && !catalog.loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium text-foreground">Your catalog is empty</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Use the AI builder above, or browse the{' '}
            <Link href="/dashboard/explore" className="text-primary hover:underline">Product Explorer</Link>{' '}
            and add products one by one.
          </p>
        </div>
      ) : (
        <>
          {/* Score + stats row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Catalog Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <ScoreRing score={score.total} />
                <div className="w-full flex flex-col gap-2">
                  {score.components.map(component => (
                    <div key={component.id} className="flex items-center gap-2" title={component.detail}>
                      <span className="text-xs text-muted-foreground w-36 shrink-0">{component.label}</span>
                      <ScoreBar score={component.score} className="flex-1" />
                      <span className="text-xs font-medium text-foreground w-7 text-right tabular-nums">{component.score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  Strengths & Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {score.strengths.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {score.strengths.map(strength => (
                      <li key={strength} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                )}
                {score.suggestions.length > 0 && (
                  <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
                    {score.suggestions.map(suggestion => (
                      <li key={suggestion} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-yellow-400 shrink-0">→</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Catalog Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="bg-surface-raised rounded-md p-3">
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-xl font-bold text-foreground">{catalog.products.length}</p>
                </div>
                <div className="bg-surface-raised rounded-md p-3">
                  <p className="text-xs text-muted-foreground">Avg Margin</p>
                  <p className="text-xl font-bold text-green-400">{avgMargin}%</p>
                </div>
                <div className="bg-surface-raised rounded-md p-3">
                  <p className="text-xs text-muted-foreground">Niches</p>
                  <p className="text-xl font-bold text-foreground">{new Set(catalog.products.flatMap(product => product.niches)).size}</p>
                </div>
                <div className="bg-surface-raised rounded-md p-3">
                  <p className="text-xs text-muted-foreground">Est. Revenue</p>
                  <p className="text-xl font-bold text-foreground">${(totalRevenue / 1000).toFixed(1)}k<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Smart suggestions: missing bundle partners */}
          {missing.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Smart Suggestions — complete your bundles
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {missing.slice(0, 4).map(({ product, partners }) => (
                  <div key={product.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Buyers of</span>
                    <span className="font-medium text-foreground">{product.name}</span>
                    <span className="text-muted-foreground">often add:</span>
                    {partners.map(partner => (
                      <button
                        key={partner.id}
                        onClick={async () => {
                          await catalog.addProducts([partner.id], 'suggestion')
                          toast({ title: 'Added to catalog', description: partner.name })
                        }}
                        className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                      >
                        + {partner.name}
                      </button>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Product table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Products</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-2 pr-4 font-medium">Product</th>
                    <th className="pb-2 pr-4 font-medium">Niche</th>
                    <th className="pb-2 pr-4 font-medium">Score</th>
                    <th className="pb-2 pr-4 font-medium">Price</th>
                    <th className="pb-2 pr-4 font-medium">Margin</th>
                    <th className="pb-2 pr-4 font-medium">Best Time</th>
                    <th className="pb-2 font-medium sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.products.map(product => {
                    const productScore = opportunityScore(product).total
                    return (
                      <tr key={product.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-4">
                          <Link href={`/dashboard/explore/${product.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                            {product.name}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                          {NICHE_MAP[product.niches[0]].emoji} {NICHE_MAP[product.niches[0]].label}
                          {product.niches.length >= 2 && <span className="text-primary ml-1">⭐</span>}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={cn('font-semibold tabular-nums', productScore >= 85 ? 'text-green-400' : productScore >= 70 ? 'text-primary' : 'text-yellow-400')}>
                            {productScore}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-foreground tabular-nums">${product.price.toFixed(2)}</td>
                        <td className="py-2.5 pr-4 text-green-400 tabular-nums">{marginPercent(product)}%</td>
                        <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{sellingWindowLabel(product)}</td>
                        <td className="py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => catalog.removeProduct(product.id)}
                            aria-label={`Remove ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
