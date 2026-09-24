// app/api/products/saved/route.ts
// GET: fetch user's saved products
// POST: save a product
// DELETE: remove a saved product

import { NextRequest, NextResponse } from 'next/server'
import { deleteSavedProduct, getSavedProducts, insertSavedProduct } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/products/saved
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const products = await getSavedProducts(user.id)
    return NextResponse.json({ products })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load saved products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/products/saved
// Body: { product }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product } = await req.json()
  if (!product) {
    return NextResponse.json({ error: 'product required' }, { status: 400 })
  }

  try {
    const id = await insertSavedProduct(user.id, product)
    return NextResponse.json({ id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/products/saved?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  try {
    await deleteSavedProduct(user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
