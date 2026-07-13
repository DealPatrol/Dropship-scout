// app/api/shopify/push-catalog/route.ts
// POST: list discovery-catalog products on the user's Shopify store.
// Uses the credentials saved in Settings; on success, marks the catalog
// item as pushed so the UI shows "Live on your store".

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  addCatalogItems,
  getCatalogItemsForProducts,
  getShopifyCredentials,
  logPushResult,
  markCatalogItemPushed,
} from '@/lib/db'
import { pushProductToShopify } from '@/lib/fulfillment'
import { getProduct } from '@/lib/merchandising/data'
import { toPushableProduct } from '@/lib/merchandising/fulfillment'

interface PushResult {
  productId: string
  name?: string
  success: boolean
  shopifyId?: string
  error?: string
  alreadyPushed?: boolean
}

// POST /api/shopify/push-catalog
// Body: { productIds: string[] }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productIds } = await req.json()
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: 'productIds required' }, { status: 400 })
  }

  const requestedProductIds = Array.from(
    new Set(productIds.filter((productId: unknown): productId is string => typeof productId === 'string'))
  )
  if (requestedProductIds.length === 0) {
    return NextResponse.json({ error: 'No valid product ids' }, { status: 400 })
  }

  const credentials = await getShopifyCredentials(user.id)
  if (!credentials) {
    return NextResponse.json(
      { error: 'No Shopify store connected. Add your store domain and access token in Settings.' },
      { status: 400 }
    )
  }

  let existingItems: Map<string, { pushed_at?: string; shopify_product_id?: string }>
  try {
    const rows = await getCatalogItemsForProducts(user.id, requestedProductIds)
    existingItems = new Map(rows.map(row => [row.product_id, row]))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load catalog'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const results: PushResult[] = []

  for (const productId of requestedProductIds) {
    const product = getProduct(productId)
    if (!product) {
      results.push({ productId, success: false, error: 'Unknown product' })
      continue
    }

    const existing = existingItems.get(productId)
    if (existing?.pushed_at || existing?.shopify_product_id) {
      results.push({
        productId,
        name: product.name,
        success: true,
        shopifyId: existing.shopify_product_id ?? undefined,
        alreadyPushed: true,
      })
      continue
    }

    const pushable = toPushableProduct(product)
    const result = await pushProductToShopify(credentials.domain, credentials.token, pushable)

    await logPushResult({
      userId: user.id,
      productName: product.name,
      sellPrice: product.price,
      status: result.success ? 'success' : 'failed',
      shopifyProductId: result.shopifyId,
      errorMessage: result.error,
    })

    if (result.success) {
      // Ensure the product is in the catalog, then mark it as pushed.
      try {
        await addCatalogItems(user.id, [productId], 'manual')
        await markCatalogItemPushed(user.id, productId, result.shopifyId)
      } catch (err) {
        results.push({
          productId,
          name: product.name,
          success: false,
          shopifyId: result.shopifyId,
          error: `Product was created on Shopify, but its catalog status could not be saved: ${err instanceof Error ? err.message : 'unknown error'}`,
        })
        continue
      }
    }

    results.push({ productId, name: product.name, ...result })
  }

  const pushed = results.filter(r => r.success).length
  return NextResponse.json({ pushed, total: requestedProductIds.length, results })
}
