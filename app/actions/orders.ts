'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/index'
import { orders, orderItems, fulfillmentHistory } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { Order, OrderItem, OrderStatus } from '@/lib/types'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getOrders(
  limit: number = 50,
  offset: number = 0
): Promise<{ orders: Order[]; total: number }> {
  const userId = await getUserId()
  
  const allOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)

  const countResult = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))

  return {
    orders: allOrders as unknown as Order[],
    total: countResult.length,
  }
}

export async function getOrder(orderId: number): Promise<Order | null> {
  const userId = await getUserId()
  
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)

  return (result[0] as unknown as Order) || null
}

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  const userId = await getUserId()
  
  // Verify user owns the order
  const order = await getOrder(orderId)
  if (!order) throw new Error('Order not found')

  return db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId)) as unknown as Promise<OrderItem[]>
}

export async function createOrder(data: {
  storeConnectionId: number
  storeOrderId: string
  customerName: string
  customerEmail: string
  shippingAddress: any
  totalAmount: number
  items: Array<{
    productListingId: number
    quantity: number
    unitCost: number
    unitPrice: number
  }>
}): Promise<Order> {
  const userId = await getUserId()

  // Calculate totals
  const totalCost = data.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
  const profit = data.totalAmount - totalCost

  // Create order
  const orderResult = await db
    .insert(orders)
    .values({
      userId,
      storeConnectionId: data.storeConnectionId,
      storeOrderId: data.storeOrderId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      shippingAddress: data.shippingAddress,
      totalAmount: data.totalAmount.toString(),
      totalCost: totalCost.toString(),
      profit: profit.toString(),
      status: 'pending',
    })
    .returning()

  const order = orderResult[0] as unknown as Order

  // Create order items
  for (const item of data.items) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productListingId: item.productListingId,
      quantity: item.quantity,
      unitCost: item.unitCost.toString(),
      unitPrice: item.unitPrice.toString(),
      lineTotal: (item.unitPrice * item.quantity).toString(),
    })
  }

  // Log initial fulfillment history
  await db.insert(fulfillmentHistory).values({
    orderId: order.id,
    status: 'pending',
    message: 'Order created',
  })

  revalidatePath('/dashboard/orders')
  return order as Order
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
  message?: string
): Promise<Order> {
  const userId = await getUserId()

  // Verify user owns the order
  const order = await getOrder(orderId)
  if (!order) throw new Error('Order not found')

  // Update order status
  const result = await db
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .returning()

  // Log to fulfillment history
  await db.insert(fulfillmentHistory).values({
    orderId,
    status,
    message: message || `Status changed to ${status}`,
  })

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return result[0] as unknown as Order
}

export async function updateOrderTracking(
  orderId: number,
  supplierOrderId: string,
  trackingNumber?: string
): Promise<Order> {
  const userId = await getUserId()

  const result = await db
    .update(orders)
    .set({
      supplierOrderId,
      trackingNumber,
      status: 'submitted',
    })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .returning()

  if (!result[0]) throw new Error('Order not found')

  await db.insert(fulfillmentHistory).values({
    orderId,
    status: 'submitted',
    message: `Submitted to supplier. Order ID: ${supplierOrderId}`,
    metadata: { trackingNumber },
  })

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return result[0] as unknown as Order
}

export async function addOrderNote(orderId: number, note: string): Promise<void> {
  const userId = await getUserId()

  const order = await getOrder(orderId)
  if (!order) throw new Error('Order not found')

  await db
    .update(orders)
    .set({ notes: note })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))

  await db.insert(fulfillmentHistory).values({
    orderId,
    status: 'note',
    message: note,
  })

  revalidatePath(`/dashboard/orders/${orderId}`)
}

export async function getOrderHistory(orderId: number): Promise<any[]> {
  const userId = await getUserId()

  const order = await getOrder(orderId)
  if (!order) throw new Error('Order not found')

  return db
    .select()
    .from(fulfillmentHistory)
    .where(eq(fulfillmentHistory.orderId, orderId))
    .orderBy(desc(fulfillmentHistory.createdAt))
}
