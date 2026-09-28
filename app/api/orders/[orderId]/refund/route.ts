import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { compensateRefundedCharge, refundSellerOrder } from '@/lib/commerce/process-order'
import { getWooCredentials } from '@/lib/channel-db'
import { refundFullShopifyOrder } from '@/lib/channels/shopify-admin'
import { refundFullWooOrder } from '@/lib/channels/woocommerce-admin'
import { getShopifyCredentials } from '@/lib/db'
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
    if (order.payoutMode === 'channel_collected' && order.externalOrderId) {
      if (order.channel === 'shopify') {
        const credentials = await getShopifyCredentials(user.id)
        if (!credentials) return NextResponse.json({ error: 'Shopify is no longer connected.' }, { status: 409 })
        await refundFullShopifyOrder(credentials.domain, credentials.token, order.externalOrderId)
      } else if (order.channel === 'woocommerce') {
        const credentials = await getWooCredentials(user.id)
        if (!credentials) return NextResponse.json({ error: 'WooCommerce is no longer connected.' }, { status: 409 })
        await refundFullWooOrder(credentials.url, credentials.key, credentials.secret, order.externalOrderId)
      } else {
        return NextResponse.json({ error: 'This channel cannot be refunded from here.' }, { status: 409 })
      }
      if (order.paymentIntentId) await compensateRefundedCharge(order.paymentIntentId)
      return NextResponse.json({ ok: true })
    }
    await refundSellerOrder(order.id, order.paymentIntentId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refund failed' },
      { status: 500 }
    )
  }
}
