// app/api/shopify/history/route.ts
// Returns the user's Shopify push history

import { NextRequest, NextResponse } from 'next/server'
import { getPushHistory } from '@/lib/db'

// GET /api/shopify/history?userId=xxx&limit=20
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    const rows = await getPushHistory(userId, limit)
    const history = rows.map(row => ({
      id: row.id,
      shopifyProductId: row.shopify_product_id,
      productName: row.product_name,
      sellPrice: Number(row.sell_price),
      pushedAt: row.pushed_at,
      status: row.status,
      errorMessage: row.error_message,
    }))
    return NextResponse.json({ history })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
