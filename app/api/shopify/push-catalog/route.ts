// app/api/shopify/push-catalog/route.ts
// POST: list discovery-catalog products on the user's Shopify store.
// Uses the credentials saved in Settings; on success, marks the catalog
// item as pushed so the UI shows "Live on your store".

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'
import { getShopifyCredentials, logPushResult } from '@/lib/db'
import { pushProductToShopify } from '@/lib/fulfillment'
import { getProduct } from '@/lib/merchandising/data'
import { toPushableProduct } from '@/lib/merchandising/fulfillment'
import type { PostgrestError } from '@supabase/supabase-js'

interface PushResult {
  productId: string
  name?: string
  success: boolean
  shopifyId?: string
  error?: string
  alreadyPushed?: boolean
}

function isMissingCatalogTable(error: PostgrestError): boolean {
  return error.code === '42P01' || error.code === 'PGRST205'
}

// POST /api/shopify/push-catalog
// Body: { productIds: string[] }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  const { data: catalogRows, error: catalogError } = await supabaseAdmin
    .from('catalog_items')
    .select('product_id, pushed_at, shopify_product_id')
    .eq('user_id', user.id)
    .in('product_id', requestedProductIds)

  const catalogAvailable = !catalogError
  if (catalogError && !isMissingCatalogTable(catalogError)) {
    return NextResponse.json({ error: catalogError.message }, { status: 500 })
  }

  const existingItems = new Map((catalogRows || []).map(row => [row.product_id, row]))
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

    if (result.success && catalogAvailable) {
      // Ensure the product is in the catalog, then mark it as pushed.
      const { error: upsertError } = await supabaseAdmin.from('catalog_items').upsert(
        {
          user_id: user.id,
          product_id: productId,
          source: 'manual',
        },
        { onConflict: 'user_id,product_id', ignoreDuplicates: true }
      )

      if (upsertError) {
        results.push({
          productId,
          name: product.name,
          success: false,
          shopifyId: result.shopifyId,
          error: `Product was created on Shopify, but catalog persistence failed: ${upsertError.message}`,
        })
        continue
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('catalog_items')
        .update({ pushed_at: new Date().toISOString(), shopify_product_id: result.shopifyId })
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .select('id')
        .maybeSingle()

      if (updateError || !updated) {
        results.push({
          productId,
          name: product.name,
          success: false,
          shopifyId: result.shopifyId,
          error: `Product was created on Shopify, but its catalog status could not be saved${updateError ? `: ${updateError.message}` : '.'}`,
        })
        continue
      }
    }

    results.push({ productId, name: product.name, ...result })
  }

  const pushed = results.filter(r => r.success).length
  return NextResponse.json({ pushed, total: requestedProductIds.length, results })
}
