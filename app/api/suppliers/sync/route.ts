// app/api/suppliers/sync/route.ts
// Re-evaluates saved products against current supplier data and refreshes their market insights

import { NextRequest, NextResponse } from 'next/server'
import { getSavedProductsForSync, updateProductTracking } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { refreshProductInsight } from '@/lib/ai'
import { SUPPLIERS, estimateMargin } from '@/lib/suppliers'
import { SupplierPlatform } from '@/lib/types'

interface SavedProductRow {
  id: string
  name: string
  category: string
  score: number
  trend: string
  sell_price: number | string
  source_price: number | string
  platforms: string[] | null
  margin?: number
}

interface SyncResult {
  id: string
  name: string
  status: 'updated' | 'unchanged' | 'error'
  changes?: {
    trend?: string
    score?: number
    margin?: number
    aiInsight?: string
  }
  error?: string
}

// POST /api/suppliers/sync
// Body: { productIds? }  — omit productIds to sync all saved products
export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productIds } = await req.json()

    const products = await getSavedProductsForSync(user.id, productIds)
    if (!products?.length) return NextResponse.json({ error: 'No products found' }, { status: 404 })

    const results: SyncResult[] = await Promise.all(
      (products as unknown as SavedProductRow[]).map(async (product): Promise<SyncResult> => {
        try {
          const refreshed = await refreshProductInsight({
            name: product.name,
            category: product.category,
            currentScore: product.score,
          })

          // Recalculate margin using current prices and platform metadata
          const platforms = (Array.isArray(product.platforms)
            ? product.platforms
            : []) as SupplierPlatform[]
          const primaryPlatform = platforms[0]
          const supplierMarginAdj = primaryPlatform
            ? getSupplierMarginAdjustment(primaryPlatform)
            : 0

          const sellPrice = parseFloat(String(product.sell_price || 0))
          const sourcePrice = parseFloat(String(product.source_price || 0))
          const newMargin = estimateMargin(sourcePrice, sellPrice) + supplierMarginAdj

          const changes: SyncResult['changes'] = {}
          let hasChanges = false

          if (refreshed.trend !== product.trend) {
            changes.trend = refreshed.trend
            hasChanges = true
          }
          if (Math.abs(refreshed.score - product.score) >= 0.2) {
            changes.score = refreshed.score
            hasChanges = true
          }
          if (refreshed.aiInsight) {
            changes.aiInsight = refreshed.aiInsight
            hasChanges = true
          }

          const clampedMargin = Math.max(0, Math.min(90, newMargin))
          if (clampedMargin !== product.margin) {
            changes.margin = clampedMargin
            hasChanges = true
          }

          if (hasChanges) {
            await updateProductTracking(product.id, {
              trend: changes.trend,
              score: changes.score,
              ai_insight: changes.aiInsight,
              margin: changes.margin,
            })
          }

          return {
            id: product.id,
            name: product.name,
            status: hasChanges ? 'updated' : 'unchanged',
            changes: hasChanges ? changes : undefined,
          }
        } catch (err: unknown) {
          return {
            id: product.id,
            name: product.name,
            status: 'error',
            error: err instanceof Error ? err.message : 'Sync failed',
          }
        }
      })
    )

    const updated = results.filter(r => r.status === 'updated').length
    const errors = results.filter(r => r.status === 'error').length

    return NextResponse.json({ results, summary: { total: results.length, updated, errors } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    console.error('Supplier sync error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/suppliers/sync — return supplier metadata for the UI
export async function GET() {
  const suppliers = Object.values(SUPPLIERS).map(s => ({
    id: s.id,
    label: s.label,
    shippingDays: s.shippingDays,
    avgMargin: s.avgMargin,
    minOrder: s.minOrder,
  }))

  return NextResponse.json({ suppliers })
}

// Adjust reported margin based on known supplier cost structures
function getSupplierMarginAdjustment(platform: SupplierPlatform): number {
  const adjustments: Partial<Record<SupplierPlatform, number>> = {
    aliexpress: 0,
    temu: 2,      // Temu tends to have slightly lower base prices
    cjdropship: 1,
    spocket: -2,  // Spocket adds a small membership overhead
    zendrop: -1,
    amazon: -3,   // Amazon fees are higher
    walmart: -2,
    ebay: -1,
  }
  return adjustments[platform] ?? 0
}
