// app/api/catalog/route.ts
// GET: fetch the user's catalog items
// POST: add one or more products to the catalog
// DELETE: remove a product from the catalog
// The user is derived from the session cookie — never from the request body.

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { addCatalogItems, getCatalogItems, removeCatalogItem } from '@/lib/db'
import { getProduct } from '@/lib/merchandising/data'

// GET /api/catalog
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await getCatalogItems(user.id)
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
// Body: { productIds: string[], source? }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productIds, source } = await req.json()
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: 'productIds required' }, { status: 400 })
  }

  const validIds = Array.from(
    new Set(
      productIds.filter(
        (productId: unknown): productId is string =>
          typeof productId === 'string' && Boolean(getProduct(productId))
      )
    )
  )
  if (validIds.length === 0) {
    return NextResponse.json({ error: 'No valid product ids' }, { status: 400 })
  }

  try {
    const added = await addCatalogItems(user.id, validIds, source || 'manual')
    return NextResponse.json({ added })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/catalog?productId=xxx
export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const productId = req.nextUrl.searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  try {
    await removeCatalogItem(user.id, productId)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
