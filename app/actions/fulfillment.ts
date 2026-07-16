'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/index'
import { orders, supplierCredentials } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSupplierAPI } from '@/lib/supplier-api'
import { updateOrderTracking } from './orders'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function submitOrderToSupplier(orderId: number): Promise<{
  success: boolean
  supplierOrderId?: string
  error?: string
}> {
  const userId = await getUserId()

  try {
    // Get order
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1)

    if (!order.length) {
      return { success: false, error: 'Order not found' }
    }

    const orderData = order[0]

    if (!orderData.supplier) {
      return { success: false, error: 'Supplier not specified for this order' }
    }

    // Get supplier credentials
    const credentials = await db
      .select()
      .from(supplierCredentials)
      .where(and(
        eq(supplierCredentials.userId, userId),
        eq(supplierCredentials.supplier, orderData.supplier)
      ))
      .limit(1)

    if (!credentials.length) {
      return { success: false, error: 'Supplier credentials not configured' }
    }

    // Get supplier API client
    const supplierAPI = getSupplierAPI(orderData.supplier, credentials[0])
    if (!supplierAPI) {
      return { success: false, error: 'Supplier API not supported' }
    }

    // Submit order to supplier
    const result = await supplierAPI.submitOrder(orderData as any, [], {} as any)

    // Update order with supplier order ID and tracking
    await updateOrderTracking(
      orderId,
      result.supplierOrderId,
      result.trackingNumber
    )

    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, supplierOrderId: result.supplierOrderId }
  } catch (error) {
    console.error('Failed to submit order to supplier:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit order',
    }
  }
}

export async function updateOrderTrackingFromSupplier(orderId: number): Promise<{
  success: boolean
  status?: string
  trackingNumber?: string
  error?: string
}> {
  const userId = await getUserId()

  try {
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1)

    if (!order.length || !order[0].supplierOrderId) {
      return { success: false, error: 'Order not found or no supplier order ID' }
    }

    const orderData = order[0]
    
    if (!orderData.supplier) {
      return { success: false, error: 'Supplier not specified for this order' }
    }

    const credentials = await db
      .select()
      .from(supplierCredentials)
      .where(and(
        eq(supplierCredentials.userId, userId),
        eq(supplierCredentials.supplier, orderData.supplier)
      ))
      .limit(1)

    if (!credentials.length) {
      return { success: false, error: 'Supplier credentials not found' }
    }

    const supplierAPI = getSupplierAPI(orderData.supplier, credentials[0])
    if (!supplierAPI) {
      return { success: false, error: 'Supplier API not supported' }
    }

    const trackingData = await supplierAPI.trackOrder(orderData.supplierOrderId!)

    return {
      success: true,
      status: trackingData.status,
      trackingNumber: trackingData.trackingNumber,
    }
  } catch (error) {
    console.error('Failed to update tracking:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tracking',
    }
  }
}

export async function autoSubmitPendingOrders(): Promise<{
  submitted: number
  failed: number
  errors: string[]
}> {
  const userId = await getUserId()
  let submitted = 0
  let failed = 0
  const errors: string[] = []

  try {
    // Get all pending orders
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, 'pending')
      ))

    for (const order of pendingOrders) {
      const result = await submitOrderToSupplier(order.id)
      if (result.success) {
        submitted++
      } else {
        failed++
        errors.push(`Order ${order.id}: ${result.error}`)
      }
    }

    revalidatePath('/dashboard/orders')
  } catch (error) {
    console.error('Auto-submit failed:', error)
  }

  return { submitted, failed, errors }
}
