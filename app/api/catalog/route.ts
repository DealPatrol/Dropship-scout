// app/api/catalog/route.ts
// GET: fetch user's catalog items
// POST: add one or more products to the catalog
// DELETE: remove a product from the catalog

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getProduct } from '@/lib/merchandising/data'

// GET /api/catalog?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('catalog_items')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = (data || []).map(row => ({
    id: row.id,
    productId: row.product_id,
    source: row.source,
    addedAt: row.added_at,
  }))

  return NextResponse.json({ items })
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

  const { error } = await supabaseAdmin.from('catalog_items').upsert(
    validIds.map((productId: string) => ({
      user_id: userId,
      product_id: productId,
      source: source || 'manual',
    })),
    { onConflict: 'user_id,product_id', ignoreDuplicates: true }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ added: validIds.length })
}

// DELETE /api/catalog?userId=xxx&productId=xxx
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const productId = req.nextUrl.searchParams.get('productId')
  if (!userId || !productId) {
    return NextResponse.json({ error: 'userId and productId required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('catalog_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
