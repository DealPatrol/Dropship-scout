// app/api/cron/track/route.ts
// Vercel cron job — runs hourly to refresh product trends for all active saved products
// Protected by CRON_SECRET header (set in vercel.json + env vars)

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { refreshProductInsight } from '@/lib/ai'

export async function GET(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Get recently saved products that haven't been refreshed in the last hour
    const { data: products, error } = await supabaseAdmin
      .from('saved_products')
      .select('id, name, category, score')
      .gte('saved_at', thirtyDaysAgo)
      .or(`updated_at.is.null,updated_at.lt.${oneHourAgo}`)
      .limit(20) // Max 20 per run to stay within AI rate limits

    if (error) throw error

    let updated = 0
    for (const product of products || []) {
      try {
        const refresh = await refreshProductInsight({
          name: product.name,
          category: product.category,
          currentScore: product.score,
        })

        await supabaseAdmin
          .from('saved_products')
          .update({
            trend: refresh.trend,
            score: refresh.score,
            ai_insight: refresh.aiInsight,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)

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
