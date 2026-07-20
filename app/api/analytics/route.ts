// app/api/analytics/route.ts
// Returns dashboard stats for a logged-in user

import { NextResponse } from 'next/server'
import { getAnalyticsData } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/analytics
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let saved: Record<string, unknown>[]
  let history: Record<string, unknown>[]
  let session: Record<string, unknown> | null
  try {
    const data = await getAnalyticsData(user.id)
    saved = data.saved
    history = data.history
    session = data.session
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analytics failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const totalPushed = history.filter(h => h.status === 'success').length
  const totalFailed = history.filter(h => h.status === 'failed').length
  const totalRevenue = history
    .filter(h => h.status === 'success')
    .reduce((sum, h) => sum + Number(h.sell_price || 0), 0)

  const avgScore =
    saved.length > 0
      ? parseFloat((saved.reduce((sum, p) => sum + Number(p.score || 0), 0) / saved.length).toFixed(1))
      : 0

  const trendCounts = saved.reduce<Record<string, number>>((acc, p) => {
    const trend = String(p.trend)
    acc[trend] = (acc[trend] || 0) + 1
    return acc
  }, {})

  const topProduct = [...saved].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0] || null

  return NextResponse.json({
    saved: {
      total: saved.length,
      avgScore,
      trendBreakdown: trendCounts,
      topProduct: topProduct
        ? { score: topProduct.score, trend: topProduct.trend }
        : null,
    },
    shopify: {
      totalPushed,
      totalFailed,
      successRate:
        totalPushed + totalFailed > 0
          ? Math.round((totalPushed / (totalPushed + totalFailed)) * 100)
          : 0,
      estimatedRevenue: parseFloat(totalRevenue.toFixed(2)),
    },
    lastSearch: session
      ? {
          searchedAt: session.searched_at,
          platforms: session.platforms,
          category: session.category,
        }
      : null,
  })
}
