// app/api/shopify/push-catalog/route.ts
// POST: list discovery-catalog products on the user's Shopify store.
// Uses the credentials saved in Settings; on success, marks the catalog
// item as pushed so the UI shows "Live on your store".

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  addCatalogItems,
  claimShopifyPush,
  completeShopifyPush,
  getCatalogItemsForProducts,
  getShopifyCredentials,
  getUserPlan,
  logPushResult,
  markCatalogItemPushed,
} from '@/lib/db'
import { PLAN_LIMITS, PlanLimitError, planLimitMessage } from '@/lib/billing'
import {
  buildShopifyPayload,
  pushProductToShopify,
  shopifyProductHandle,
} from '@/lib/fulfillment'
import { getProduct } from '@/lib/merchandising/data'
import { toPushableProduct } from '@/lib/merchandising/fulfillment'
import { validateShopifyConnection } from '@/lib/shopify'
import type { ShopifyProductPayload } from '@/lib/fulfillment'

interface PushResult {
  productId: string
  name?: string
  success: boolean
  shopifyId?: string
  error?: string
  alreadyPushed?: boolean
  preview?: ShopifyProductPayload['product']
}

// POST /api/shopify/push-catalog
// Body: { productIds: string[] }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productIds, dryRun = false } = await req.json()
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

  const connection = await validateShopifyConnection(credentials.domain, credentials.token)
  if (!connection.valid) {
    return NextResponse.json(
      {
        error: connection.error,
        pushed: 0,
        total: requestedProductIds.length,
        results: requestedProductIds.map(productId => ({
          productId,
          success: false,
          error: connection.error,
        })),
      },
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
  const plan = await getUserPlan(user.id)
  const monthlyLimit = PLAN_LIMITS[plan].shopifyPushesPerMonth

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
    if (dryRun) {
      results.push({
        productId,
        name: product.name,
        success: true,
        preview: buildShopifyPayload(pushable).product,
      })
      continue
    }

    const operationKey = shopifyProductHandle(pushable)
    const claim = await claimShopifyPush(user.id, operationKey, monthlyLimit)
    if (claim.state === 'existing') {
      try {
        await addCatalogItems(
          user.id,
          [productId],
          'manual',
          PLAN_LIMITS[plan].catalogProducts
        )
        await markCatalogItemPushed(user.id, productId, claim.shopifyProductId)
        results.push({
          productId,
          name: product.name,
          success: true,
          shopifyId: claim.shopifyProductId,
          alreadyPushed: true,
        })
      } catch (err) {
        results.push({
          productId,
          name: product.name,
          success: false,
          shopifyId: claim.shopifyProductId,
          error: err instanceof Error ? err.message : 'Could not reconcile catalog state',
        })
      }
      continue
    }
    if (claim.state === 'in_progress') {
      results.push({
        productId,
        name: product.name,
        success: false,
        error: 'This product push is already in progress.',
      })
      continue
    }
    if (claim.state === 'limit') {
      results.push({
        productId,
        name: product.name,
        success: false,
        error: monthlyLimit === null
          ? 'Shopify push reservation failed'
          : planLimitMessage('Shopify pushes per month', monthlyLimit),
      })
      continue
    }

    try {
      await addCatalogItems(
        user.id,
        [productId],
        'manual',
        PLAN_LIMITS[plan].catalogProducts
      )
    } catch (err) {
      await completeShopifyPush({
        userId: user.id,
        operationKey,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Could not prepare catalog item',
      })
      results.push({
        productId,
        name: product.name,
        success: false,
        error: err instanceof PlanLimitError ? err.message : 'Could not prepare catalog item',
      })
      continue
    }

    const result = await pushProductToShopify(credentials.domain, credentials.token, pushable)
    await completeShopifyPush({
      userId: user.id,
      operationKey,
      success: result.success,
      shopifyProductId: result.shopifyId,
      errorMessage: result.error,
    })

    await logPushResult({
      userId: user.id,
      productName: product.name,
      sellPrice: product.price,
      status: result.success ? 'success' : 'failed',
      shopifyProductId: result.shopifyId,
      errorMessage: result.error,
    })

    if (result.success) {
      try {
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

  const pushed = dryRun ? 0 : results.filter(r => r.success).length
  return NextResponse.json({ dryRun: Boolean(dryRun), pushed, total: requestedProductIds.length, results })
}
