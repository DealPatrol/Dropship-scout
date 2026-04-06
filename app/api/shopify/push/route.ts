// app/api/shopify/push/route.ts
// Pushes products to Shopify Admin API.
// The Shopify access token NEVER touches the browser — sent here and used server-side only.

import { NextRequest, NextResponse } from 'next/server'
import { pushProductToShopify } from '@/lib/fulfillment'
import { logPushResult } from '@/lib/db'
import { Product } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { domain, token, products, userId } = await req.json()

  if (!domain || !token || !products?.length) {
    return NextResponse.json(
      { error: 'domain, token, and products are required' },
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
