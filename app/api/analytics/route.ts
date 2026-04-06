// app/api/analytics/route.ts
// Returns dashboard stats for a logged-in user

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/analytics?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const [savedRes, historyRes, sessionRes] = await Promise.all([
    supabaseAdmin
      .from('saved_products')
      .select('id, score, trend, sell_price, source_price, saved_at')
      .eq('user_id', userId),

    supabaseAdmin
      .from('push_history')
      .select('id, status, sell_price, pushed_at')
      .eq('user_id', userId),

    supabaseAdmin
      .from('search_sessions')
      .select('searched_at, platforms, category')
      .eq('user_id', userId)
      .single(),
  ])

  const saved = savedRes.data || []
  const history = historyRes.data || []

  const totalPushed = history.filter(h => h.status === 'success').length
  const totalFailed = history.filter(h => h.status === 'failed').length
  const totalRevenue = history
    .filter(h => h.status === 'success')
    .reduce((sum, h) => sum + (h.sell_price || 0), 0)

  const avgScore =
    saved.length > 0
      ? parseFloat((saved.reduce((sum, p) => sum + (p.score || 0), 0) / saved.length).toFixed(1))
      : 0

  const trendCounts = saved.reduce<Record<string, number>>((acc, p) => {
    acc[p.trend] = (acc[p.trend] || 0) + 1
    return acc
  }, {})

  const topProduct = saved.sort((a, b) => (b.score || 0) - (a.score || 0))[0] || null

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
    lastSearch: sessionRes.data
      ? {
          searchedAt: sessionRes.data.searched_at,
          platforms: sessionRes.data.platforms,
          category: sessionRes.data.category,
        }
      : null,
  })
}
