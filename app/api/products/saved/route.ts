import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { savedProducts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/products/saved
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const products = await db
    .select()
    .from(savedProducts)
    .where(eq(savedProducts.userId, session.user.id))

  return NextResponse.json({ products })
}

// POST /api/products/saved
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, url, price, image, supplier, notes } = body

  const result = await db
    .insert(savedProducts)
    .values({
      userId: session.user.id,
      title,
      url,
      price: price ? parseFloat(price) : null,
      image,
      supplier,
      notes,
    })
    .returning({ id: savedProducts.id })

  return NextResponse.json({ id: result[0]?.id })
}

// DELETE /api/products/saved?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db
    .delete(savedProducts)
    .where(eq(savedProducts.id, parseInt(id)))

  return NextResponse.json({ success: true })
}
