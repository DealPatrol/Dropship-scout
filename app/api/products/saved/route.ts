// app/api/products/saved/route.ts
// GET: fetch user's saved products
// POST: save a product
// DELETE: remove a saved product

import { NextRequest, NextResponse } from 'next/server'
import { deleteSavedProduct, getSavedProducts, insertSavedProduct } from '@/lib/db'

// GET /api/products/saved?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    const products = await getSavedProducts(userId)
    return NextResponse.json({ products })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load saved products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/products/saved
// Body: { userId, product }
export async function POST(req: NextRequest) {
  const { userId, product } = await req.json()
  if (!userId || !product) {
    return NextResponse.json({ error: 'userId and product required' }, { status: 400 })
  }

  try {
    const id = await insertSavedProduct(userId, product)
    return NextResponse.json({ id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/products/saved?id=xxx&userId=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const userId = req.nextUrl.searchParams.get('userId')
  if (!id || !userId) {
    return NextResponse.json({ error: 'id and userId required' }, { status: 400 })
  }

  try {
    await deleteSavedProduct(userId, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
