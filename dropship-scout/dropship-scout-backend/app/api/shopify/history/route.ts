// app/api/shopify/history/route.ts
// Returns the user's Shopify push history

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/shopify/history?userId=xxx&limit=20
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('push_history')
    .select('*')
    .eq('user_id', userId)
    .order('pushed_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const history = (data || []).map(row => ({
    id: row.id,
    shopifyProductId: row.shopify_product_id,
    productName: row.product_name,
    sellPrice: row.sell_price,
    pushedAt: row.pushed_at,
    status: row.status,
    errorMessage: row.error_message,
  }))

  return NextResponse.json({ history })
}
