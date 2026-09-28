import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { pullWooOrders } from '@/lib/channels/sync'

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await pullWooOrders(user.id)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'WooCommerce order pull failed' },
      { status: 500 }
    )
  }
}