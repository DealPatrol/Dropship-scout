// app/api/catalog/route.ts
// GET: fetch user's catalog items
// POST: add one or more products to the catalog
// DELETE: remove a product from the catalog

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'
import { getProduct } from '@/lib/merchandising/data'

// GET /api/catalog
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('catalog_items')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = (data || []).map(row => ({
    id: row.id,
    productId: row.product_id,
    source: row.source,
    addedAt: row.added_at,
    pushedAt: row.pushed_at ?? undefined,
    shopifyProductId: row.shopify_product_id ?? undefined,
  }))

  return NextResponse.json({ items })
}

// POST /api/catalog
// Body: { productIds: string[], source? }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  const { data: existing, error: selectError } = await supabaseAdmin
    .from('catalog_items')
    .select('product_id')
    .eq('user_id', user.id)
    .in('product_id', validIds)

  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 })

  const existingIds = new Set((existing || []).map(row => row.product_id))
  const { error } = await supabaseAdmin.from('catalog_items').upsert(
    validIds.map((productId: string) => ({
      user_id: user.id,
      product_id: productId,
      source: source || 'manual',
    })),
    { onConflict: 'user_id,product_id', ignoreDuplicates: true }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ added: validIds.filter(id => !existingIds.has(id)).length })
}

// DELETE /api/catalog?productId=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const productId = req.nextUrl.searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('catalog_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
