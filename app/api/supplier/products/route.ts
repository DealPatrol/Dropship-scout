import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { dollarsToCents } from '@/lib/commerce/money'
import { getSupplierProfileForUser, upsertSupplierProduct } from '@/lib/store-db'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getSupplierProfileForUser(user.id)
  if (!profile) return NextResponse.json({ error: 'Create a supplier profile first.' }, { status: 409 })
  const body = await req.json().catch(() => null) as {
    title?: string
    description?: string
    imageUrl?: string
    cost?: number
    shipping?: number
    stock?: number
    sku?: string
  } | null
  const title = body?.title?.trim() ?? ''
  const costCents = dollarsToCents(body?.cost)
  const shippingCents = dollarsToCents(body?.shipping)
  if (title.length < 2 || costCents === null || shippingCents === null) {
    return NextResponse.json({ error: 'Title, cost, and shipping are required.' }, { status: 400 })
  }
  if (!Number.isInteger(body?.stock) || (body?.stock ?? 0) < 0) {
    return NextResponse.json({ error: 'Stock must be a whole number.' }, { status: 400 })
  }
  const externalId = randomUUID()
  const id = await upsertSupplierProduct({
    provider: 'direct',
    externalId,
    variantId: externalId,
    supplierProfileId: profile.id,
    title: title.slice(0, 140),
    description: body?.description?.trim() || null,
    imageUrl: body?.imageUrl?.trim() || null,
    costCents,
    shippingCents,
    sku: body?.sku?.trim() || null,
    stock: body?.stock ?? 0,
    available: (body?.stock ?? 0) > 0,
  })
  return NextResponse.json({ id })
}
