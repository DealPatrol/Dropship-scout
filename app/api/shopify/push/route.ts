// app/api/shopify/push/route.ts
// Pushes products to Shopify Admin API.
// The Shopify access token NEVER touches the browser — it is read from the
// user's stored credentials (Settings) or accepted server-side in the body.

import { NextRequest, NextResponse } from 'next/server'
import { pushProductToShopify } from '@/lib/fulfillment'
import { getShopifyCredentials } from '@/lib/db'
import { logPushResult } from '@/lib/db'
import { Product } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { products, userId } = body
  let { domain, token } = body

  if (!products?.length) {
    return NextResponse.json({ error: 'products are required' }, { status: 400 })
  }

  // Fall back to the credentials saved in Settings.
  if ((!domain || !token) && userId) {
    const stored = await getShopifyCredentials(userId)
    domain = domain || stored?.domain
    token = token || stored?.token
  }

  if (!domain || !token) {
    return NextResponse.json(
      { error: 'No Shopify store connected. Add your store domain and access token in Settings.' },
      { status: 400 }
    )
  }

  const results = []

  for (const p of products as Product[]) {
    const result = await pushProductToShopify(domain, token, p)

    results.push({ name: p.name, ...result })

    if (userId) {
      await logPushResult({
        userId,
        productName: p.name,
        sellPrice: parseFloat(p.sellPrice),
        status: result.success ? 'success' : 'failed',
        shopifyProductId: result.shopifyId,
        errorMessage: result.error,
      })
    }
  }

  const pushed = results.filter(r => r.success).length
  return NextResponse.json({ pushed, total: products.length, results })
}
