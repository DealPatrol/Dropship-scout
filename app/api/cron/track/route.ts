// app/api/cron/track/route.ts
// Vercel cron job — runs hourly to refresh product trends for all active saved products
// Protected by CRON_SECRET header (set in vercel.json + env vars)

import { NextRequest, NextResponse } from 'next/server'
import { getStaleTrackedProducts, updateProductTracking } from '@/lib/db'
import { refreshProductInsight } from '@/lib/ai'

export async function GET(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Recently saved products (30 days) not refreshed in the last hour,
    // max 20 per run to stay within AI rate limits
    const products = await getStaleTrackedProducts(30, 60)

    let updated = 0
    for (const product of products) {
      try {
        const refresh = await refreshProductInsight({
          name: product.name,
          category: product.category,
          currentScore: Number(product.score),
        })

        await updateProductTracking(product.id, {
          trend: refresh.trend,
          score: refresh.score,
          ai_insight: refresh.aiInsight,
        })

        updated++
      } catch {
        // Skip individual failures — don't abort the whole batch
      }
    }

    return NextResponse.json({
      ok: true,
      processed: products?.length || 0,
      updated,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cron error'
    console.error('Cron track error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
