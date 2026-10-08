'use client'

import { useMemo, useState } from 'react'
import type { PublicProduct } from '@/lib/marketing/public-catalog'
import { matchesSeason } from '@/lib/marketing/public-catalog'
import type { Season } from '@/lib/merchandising/types'

const SEASON_OPTIONS: { id: 'all' | 'year-round' | Season; label: string }[] = [
  { id: 'all', label: 'Any timing' },
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'fall', label: 'Fall' },
  { id: 'winter', label: 'Winter' },
  { id: 'year-round', label: 'Year-round' },
]

export function CatalogPreview({
  products,
  niches,
  initialSeason,
}: {
  products: PublicProduct[]
  niches: { id: string; label: string }[]
  initialSeason: Season
}) {
  const [niche, setNiche] = useState('all')
  const [season, setSeason] = useState<'all' | 'year-round' | Season>(initialSeason)
  const [competition, setCompetition] = useState('all')

  const filtered = useMemo(() => {
    return products.filter(product => {
      if (niche !== 'all' && !product.nicheIds.includes(niche as PublicProduct['nicheIds'][number])) return false
      if (competition !== 'all' && product.competition !== competition) return false
      if (season === 'year-round') return product.seasonality === 'evergreen'
      if (season === 'all') return true
      return matchesSeason(product, season)
    })
  }, [products, niche, season, competition])

  const visible = filtered.slice(0, 12)

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Niche
          <select className="h-10 rounded-md border border-border bg-background px-3" value={niche} onChange={event => setNiche(event.target.value)}>
            <option value="all">All niches</option>
            {niches.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Timing
          <select className="h-10 rounded-md border border-border bg-background px-3" value={season} onChange={event => setSeason(event.target.value as 'all' | 'year-round' | Season)}>
            {SEASON_OPTIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sample competition tag
          <select className="h-10 rounded-md border border-border bg-background px-3" value={competition} onChange={event => setCompetition(event.target.value)}>
            <option value="all">Any tag</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Showing {visible.length} of {filtered.length} sample products. Margin is (sample retail − sample cost) / sample retail. It ignores shipping, ads, and refunds.
      </p>
      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No sample products match those filters.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {visible.map(product => (
            <li key={product.id} className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-semibold">{product.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{product.audience}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Niches</dt>
                  <dd>{product.niches.join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Window</dt>
                  <dd>{product.window}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sample cost / retail</dt>
                  <dd>${product.sampleCost.toFixed(2)} / ${product.samplePrice.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sample margin</dt>
                  <dd>{product.marginPercent}%</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Competition tag</dt>
                  <dd>{product.competition}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sample ship time</dt>
                  <dd>{product.shippingDays} days</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
