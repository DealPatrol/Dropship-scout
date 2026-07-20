// app/api/shopify/history/route.ts
// Returns the user's Shopify push history

import { NextRequest, NextResponse } from 'next/server'
import { getPushHistory } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/shopify/history?limit=20
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  try {
    const rows = await getPushHistory(user.id, limit)
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
