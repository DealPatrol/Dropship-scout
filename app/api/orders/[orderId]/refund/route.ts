import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { refundSellerOrder } from '@/lib/commerce/process-order'
import { getOrderForSeller } from '@/lib/store-db'

export async function POST(_req: Request, { params }: { params: { orderId: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const order = await getOrderForSeller(user.id, params.orderId)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'refunded' || order.status === 'supplier_rejected') {
    return NextResponse.json({ ok: true, alreadyRefunded: true })
  }
  if (!order.paymentIntentId || (order.status !== 'fulfilled' && order.status !== 'fulfilling')) {
    return NextResponse.json({ error: 'This order cannot be refunded.' }, { status: 409 })
  }
  try {
    await refundSellerOrder(order.id, order.paymentIntentId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refund failed' },
      { status: 500 }
    )
  }
}
