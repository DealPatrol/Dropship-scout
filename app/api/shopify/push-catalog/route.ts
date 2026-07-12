// app/api/shopify/push-catalog/route.ts
// POST: list discovery-catalog products on the user's Shopify store.
// Uses the credentials saved in Settings; on success, marks the catalog
// item as pushed so the UI shows "Live on your store".

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getShopifyCredentials, logPushResult } from '@/lib/db'
import { pushProductToShopify } from '@/lib/fulfillment'
import { getProduct } from '@/lib/merchandising/data'
import { toPushableProduct } from '@/lib/merchandising/fulfillment'

// POST /api/shopify/push-catalog
// Body: { userId, productIds: string[] }
export async function POST(req: NextRequest) {
  const { userId, productIds } = await req.json()
  if (!userId || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: 'userId and productIds required' }, { status: 400 })
  }

  const credentials = await getShopifyCredentials(userId)
  if (!credentials) {
    return NextResponse.json(
      { error: 'No Shopify store connected. Add your store domain and access token in Settings.' },
      { status: 400 }
    )
  }

  const results = []

  for (const productId of productIds as string[]) {
    const product = getProduct(productId)
    if (!product) {
      results.push({ productId, success: false, error: 'Unknown product' })
      continue
    }

    const pushable = toPushableProduct(product)
    const result = await pushProductToShopify(credentials.domain, credentials.token, pushable)
    results.push({ productId, name: product.name, ...result })

    await logPushResult({
      userId,
      productName: product.name,
      sellPrice: product.price,
      status: result.success ? 'success' : 'failed',
      shopifyProductId: result.shopifyId,
      errorMessage: result.error,
    })

    if (result.success) {
      // Ensure the product is in the catalog, then mark it as pushed.
      await supabaseAdmin.from('catalog_items').upsert(
        {
          user_id: userId,
          product_id: productId,
          source: 'manual',
        },
        { onConflict: 'user_id,product_id', ignoreDuplicates: true }
      )
      await supabaseAdmin
        .from('catalog_items')
        .update({ pushed_at: new Date().toISOString(), shopify_product_id: result.shopifyId })
        .eq('user_id', userId)
        .eq('product_id', productId)
    }
  }

  const pushed = results.filter(r => r.success).length
  return NextResponse.json({ pushed, total: productIds.length, results })
}
