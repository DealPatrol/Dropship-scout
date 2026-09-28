import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listSellerOrders } from '@/lib/store-db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orders = await listSellerOrders(user.id)
  return NextResponse.json({ orders })
}
