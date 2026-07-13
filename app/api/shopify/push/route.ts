// app/api/shopify/push/route.ts
// Pushes products to Shopify Admin API.
// The Shopify access token NEVER touches the browser — it is read from the
// user's stored credentials (Settings).

import { NextRequest, NextResponse } from 'next/server'
import { pushProductToShopify } from '@/lib/fulfillment'
import { getShopifyCredentials, logPushResult } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Product } from '@/lib/types'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { products } = body

  if (!products?.length) {
    return NextResponse.json({ error: 'products are required' }, { status: 400 })
  }

  const credentials = await getShopifyCredentials(user.id)
  if (!credentials) {
    return NextResponse.json(
      { error: 'No Shopify store connected. Add your store domain and access token in Settings.' },
      { status: 400 }
    )
  }

  const results = []

  for (const p of products as Product[]) {
    const result = await pushProductToShopify(credentials.domain, credentials.token, p)

    results.push({ name: p.name, ...result })

    await logPushResult({
      userId: user.id,
      productName: p.name,
      sellPrice: parseFloat(p.sellPrice),
      status: result.success ? 'success' : 'failed',
      shopifyProductId: result.shopifyId,
      errorMessage: result.error,
    })
  }

  const pushed = results.filter(r => r.success).length
  return NextResponse.json({ pushed, total: products.length, results })
}
