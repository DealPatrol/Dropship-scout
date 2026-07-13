// app/api/catalog/route.ts
// GET: fetch user's catalog items
// POST: add one or more products to the catalog
// DELETE: remove a product from the catalog

import { NextRequest, NextResponse } from 'next/server'
import { addCatalogItems, getCatalogItems, removeCatalogItem } from '@/lib/db'
import { getProduct } from '@/lib/merchandising/data'

// GET /api/catalog?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    const rows = await getCatalogItems(userId)
    const items = rows.map(row => ({
      id: row.id,
      productId: row.product_id,
      source: row.source,
      addedAt: row.added_at,
      pushedAt: row.pushed_at ?? undefined,
      shopifyProductId: row.shopify_product_id ?? undefined,
    }))
    return NextResponse.json({ items })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load catalog'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/catalog
// Body: { userId, productIds: string[], source? }
export async function POST(req: NextRequest) {
  const { userId, productIds, source } = await req.json()
  if (!userId || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: 'userId and productIds required' }, { status: 400 })
  }

  const validIds = productIds.filter((id: string) => getProduct(id))
  if (validIds.length === 0) {
    return NextResponse.json({ error: 'No valid product ids' }, { status: 400 })
  }

  try {
    await addCatalogItems(userId, validIds, source || 'manual')
    return NextResponse.json({ added: validIds.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/catalog?userId=xxx&productId=xxx
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const productId = req.nextUrl.searchParams.get('productId')
  if (!userId || !productId) {
    return NextResponse.json({ error: 'userId and productId required' }, { status: 400 })
  }

  try {
    await removeCatalogItem(userId, productId)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
