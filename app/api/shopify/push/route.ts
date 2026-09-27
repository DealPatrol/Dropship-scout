// app/api/shopify/push/route.ts
// Pushes products to Shopify Admin API.
// The Shopify access token NEVER touches the browser — it is read from the
// user's stored credentials (Settings).

import { NextRequest, NextResponse } from 'next/server'
import { buildShopifyPayload, pushProductToShopify } from '@/lib/fulfillment'
import {
  getShopifyCredentials,
  getUserPlan,
  logPushResult,
  releaseShopifyPush,
  reserveShopifyPush,
} from '@/lib/db'
import { getSession } from '@/lib/auth'
import { PLAN_LIMITS, planLimitMessage } from '@/lib/billing'
import { validateShopifyConnection } from '@/lib/shopify'
import { Product } from '@/lib/types'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { products, dryRun = false } = body

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

  const connection = await validateShopifyConnection(credentials.domain, credentials.token)
  if (!connection.valid) {
    return NextResponse.json(
      {
        error: connection.error,
        pushed: 0,
        total: products.length,
        results: products.map((product: Product) => ({
          name: product.name,
          success: false,
          error: connection.error,
        })),
      },
      { status: 400 }
    )
  }

  const results = []
  const plan = await getUserPlan(user.id)
  const monthlyLimit = PLAN_LIMITS[plan].shopifyPushesPerMonth

  for (const p of products as Product[]) {
    if (dryRun) {
      results.push({
        name: p.name,
        success: true,
        preview: buildShopifyPayload(p).product,
      })
      continue
    }
    if (!(await reserveShopifyPush(user.id, monthlyLimit))) {
      results.push({
        name: p.name,
        success: false,
        error: monthlyLimit === null
          ? 'Shopify push reservation failed'
          : planLimitMessage('Shopify pushes per month', monthlyLimit),
      })
      continue
    }

    const result = await pushProductToShopify(credentials.domain, credentials.token, p)
    if (!result.success) await releaseShopifyPush(user.id, monthlyLimit)

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

  const pushed = dryRun ? 0 : results.filter(r => r.success).length
  return NextResponse.json({ dryRun: Boolean(dryRun), pushed, total: products.length, results })
}
