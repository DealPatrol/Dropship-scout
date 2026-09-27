// app/api/products/saved/route.ts
// GET: fetch user's saved products
// POST: save a product
// DELETE: remove a saved product

import { NextRequest, NextResponse } from 'next/server'
import {
  deleteSavedProduct,
  getSavedProducts,
  getUserPlan,
  insertSavedProduct,
} from '@/lib/db'
import { getSession } from '@/lib/auth'
import { PLAN_LIMITS, PlanLimitError } from '@/lib/billing'
import { validateSavedProduct } from '@/lib/saved-products'

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

  const { product: rawProduct } = await req.json()
  let product
  try {
    product = validateSavedProduct(rawProduct)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid product' },
      { status: 400 }
    )
  }

  try {
    const plan = await getUserPlan(user.id)
    const limit = PLAN_LIMITS[plan].savedProducts
    const id = await insertSavedProduct(user.id, product, limit)
    return NextResponse.json({ id })
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json({ error: err.message, code: 'PLAN_LIMIT' }, { status: 403 })
    }
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
