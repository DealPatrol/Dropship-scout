import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/index'
import { savedProducts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await db
      .select()
      .from(savedProducts)
      .where(eq(savedProducts.userId, session.user.id))
      .orderBy(desc(savedProducts.createdAt))

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Failed to fetch saved products:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
