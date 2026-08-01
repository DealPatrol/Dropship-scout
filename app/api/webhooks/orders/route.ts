import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { orders, orderItems, fulfillmentHistory, storeConnections } from '@/lib/db/schema'
import { parseWebhookOrder } from '@/lib/webhook-parsers'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

/**
 * Generic webhook receiver for any ecommerce platform
 * 
 * Usage:
 * 1. User creates store connection and gets webhook URL
 * 2. User adds this URL to their store's webhook settings
 * 3. When order is created, store sends POST to this endpoint
 * 4. We parse the order, create record, and auto-fulfill
 * 
 * URL format: /api/webhooks/orders?storeId={storeId}&signature={signature}
 */
export async function POST(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('storeId')
    const signature = request.nextUrl.searchParams.get('signature')

    if (!storeId) {
      return NextResponse.json(
        { error: 'Missing storeId parameter' },
        { status: 400 }
      )
    }

    // Get store connection to verify webhook signature
    const storeConnection = await db
      .select()
      .from(storeConnections)
      .where(eq(storeConnections.id, parseInt(storeId)))
      .limit(1)

    if (!storeConnection.length) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    const store = storeConnection[0]
    const body = await request.json()

    // Verify webhook signature if provided
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', store.accessToken || 'webhook-secret')
        .update(JSON.stringify(body))
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('[v0] Webhook signature mismatch')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Parse webhook to standard format
    const parsedOrder = parseWebhookOrder(body)
    if (!parsedOrder) {
      return NextResponse.json(
        { error: 'Could not parse order from webhook' },
        { status: 400 }
      )
    }

    // Check if order already exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.storeOrderId, parsedOrder.storeOrderId))
      .limit(1)

    if (existingOrder.length) {
      console.log('[v0] Order already exists:', parsedOrder.storeOrderId)
      return NextResponse.json(
        { message: 'Order already processed', orderId: existingOrder[0].id },
        { status: 200 }
      )
    }

    // Calculate totals
    const totalCost = parsedOrder.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const profit = parsedOrder.totalAmount - totalCost

    // Create order record
    const newOrder = await db.insert(orders).values({
      userId: store.userId,
      storeConnectionId: parseInt(storeId),
      storeOrderId: parsedOrder.storeOrderId,
      customerName: parsedOrder.customerName,
      customerEmail: parsedOrder.customerEmail,
      shippingAddress: JSON.stringify(parsedOrder.shippingAddress),
      totalAmount: parsedOrder.totalAmount.toString(),
      totalCost: totalCost.toString(),
      profit: profit.toString(),
      status: 'pending',
    }).returning()

    if (!newOrder[0]) {
      throw new Error('Failed to create order')
    }

    const orderId = newOrder[0].id

    // Create order items
    await Promise.all(
      parsedOrder.items.map(item =>
        db.insert(orderItems).values({
          orderId,
          productListingId: 0, // No product listing mapping for generic webhooks
          quantity: item.quantity,
          unitCost: (item.price).toString(),
          unitPrice: (item.price).toString(),
          lineTotal: (item.price * item.quantity).toString(),
        })
      )
    )

    // Log fulfillment event
    await db.insert(fulfillmentHistory).values({
      orderId,
      status: 'received',
      message: `Order received via webhook from ${store.platform}`,
      metadata: JSON.stringify({ platform: store.platform, storeId }),
    })

    console.log('[v0] Order created from webhook:', {
      orderId,
      storeOrderId: parsedOrder.storeOrderId,
      customer: parsedOrder.customerEmail,
      total: parsedOrder.totalAmount,
    })

    return NextResponse.json(
      {
        success: true,
        orderId,
        storeOrderId: parsedOrder.storeOrderId,
        message: 'Order received and queued for fulfillment',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
