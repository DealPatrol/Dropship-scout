import type Stripe from 'stripe'
import type { ShippingAddress } from '@/lib/commerce/types'
import { assertCommercePaymentsAllowed, platformFeeBps, supplierOrdersMode } from '@/lib/commerce/modes'
import { readPaidCharge } from '@/lib/commerce/checkout-address'
import {
  compensateAfterRefund,
  routePaidOrder,
  type PaymentPort,
  type RouteGroup,
  type RouteItem,
  type SupplierPort,
} from '@/lib/commerce/order-routing'
import { settlementFor } from '@/lib/commerce/types'
import { getStripe } from '@/lib/stripe'
import { cancelDirectOrder, placeDirectOrder } from '@/lib/supplier-api/direct'
import { supplierGateway } from '@/lib/supplier-api'
import {
  addSupplierNotification,
  claimOrder,
  getSupplierNotifyUrl,
  listJobsNeedingTracking,
  listOrderTransfers,
  markOrderPayment,
  markTransferReversed,
  orderIdForPaymentIntent,
  saveFulfilledOrder,
  saveRefundedOrder,
  saveTracking,
  takeOpenFulfillments,
  type ClaimedOrder,
  type FulfillmentItem,
} from '@/lib/store-db'

function payments(): PaymentPort {
  return {
    async refund(input) {
      assertCommercePaymentsAllowed()
      await getStripe().refunds.create(
        { payment_intent: input.paymentIntentId },
        { idempotencyKey: input.idempotencyKey }
      )
    },
    async transfer(input) {
      assertCommercePaymentsAllowed()
      const transfer = await getStripe().transfers.create(
        {
          amount: input.amountCents,
          currency: 'usd',
          destination: input.destinationAccountId,
          source_transaction: input.chargeId,
          transfer_group: input.transferGroup,
          metadata: input.metadata,
        },
        { idempotencyKey: input.idempotencyKey }
      )
      return { id: transfer.id }
    },
    async reverseTransfer(input) {
      assertCommercePaymentsAllowed()
      const reversal = await getStripe().transfers.createReversal(
        input.transferId,
        {},
        { idempotencyKey: input.idempotencyKey }
      )
      return { id: reversal.id }
    },
  }
}

function suppliers(): SupplierPort {
  return {
    async placeOrder(group, input) {
      switch (group.provider) {
        case 'direct':
          return placeDirectOrder(group, input)
        case 'cj':
        case 'printful':
        case 'printify':
          return supplierGateway(group.provider).placeOrder(group, input)
        default: {
          const exhaustive: never = group.provider
          return { status: 'error', reason: `Unsupported supplier ${exhaustive}` }
        }
      }
    },
    async cancelOrder(group, externalOrderId) {
      switch (group.provider) {
        case 'direct':
          await cancelDirectOrder(group)
          return
        case 'cj':
        case 'printful':
        case 'printify':
          await supplierGateway(group.provider).cancelOrder(group, externalOrderId)
          return
        default: {
          const exhaustive: never = group.provider
          throw new Error(`Unsupported supplier ${exhaustive}`)
        }
      }
    },
  }
}

function orderNumber(orderId: string, groupId: string): string {
  const compact = `${orderId}${groupId}`.replace(/[^a-zA-Z0-9]/g, '')
  return compact.slice(0, 50)
}

function groupsFrom(order: ClaimedOrder): RouteGroup[] {
  const buckets = new Map<string, FulfillmentItem[]>()
  for (const item of order.items) {
    const key = item.provider === 'direct' ? `direct:${item.supplierProfileId}` : item.provider
    const current = buckets.get(key) ?? []
    current.push(item)
    buckets.set(key, current)
  }

  return Array.from(buckets.entries()).map(([id, items]) => {
    const provider = items[0]?.provider
    if (!provider) throw new Error('Order group is empty')
    const routeItems: RouteItem[] = items.map(item => ({
      variantId: item.externalVariantId,
      productId: item.externalProductId,
      supplierProductId: item.supplierProductId,
      quantity: item.quantity,
      storeLineItemId: item.id,
      title: item.title,
    }))
    const costCents = items.reduce(
      (sum, item) => sum + (item.unitCostCents + item.unitShippingCents) * item.quantity,
      0
    )
    return {
      id,
      orderNumber: orderNumber(order.id, id),
      provider,
      settlement: settlementFor(provider),
      destinationAccountId: provider === 'direct' ? items[0]?.supplierAccountId : null,
      supplierProfileId: items[0]?.supplierProfileId,
      costCents,
      items: routeItems,
    }
  })
}

async function notifyDirectSuppliers(orderId: string, groups: RouteGroup[]): Promise<void> {
  for (const group of groups) {
    if (group.provider !== 'direct' || !group.supplierProfileId) continue
    const message = `New order ${orderId.slice(0, 8)} is ready to ship.`
    await addSupplierNotification({
      supplierProfileId: group.supplierProfileId,
      orderId,
      message,
    })
    const notifyUrl = await getSupplierNotifyUrl(group.supplierProfileId)
    if (!notifyUrl) continue
    await fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, message }),
      signal: AbortSignal.timeout(5_000),
    }).catch(() => undefined)
  }
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId
  if (!orderId) throw new Error('Storefront checkout is missing orderId')
  const payment = await readPaidCharge(session)
  if (!payment) return

  const claimed = await claimOrder(orderId)
  if (!claimed) return
  if (payment.grossCents !== claimed.grossCents) {
    await payments().refund({
      paymentIntentId: payment.paymentIntentId,
      idempotencyKey: `store-refund-${orderId}`,
    })
    await saveRefundedOrder(orderId, 'refunded', 'Paid amount does not match the order total.')
    return
  }

  await markOrderPayment({
    orderId,
    paymentIntentId: payment.paymentIntentId,
    chargeId: payment.chargeId,
    address: payment.address,
    grossCents: payment.grossCents,
  })

  const groups = groupsFrom(claimed)
  const result = await routePaidOrder(
    {
      orderId,
      paymentIntentId: payment.paymentIntentId,
      chargeId: payment.chargeId,
      sellerAccountId: claimed.sellerAccountId,
      grossCents: claimed.grossCents,
      merchandiseCents: claimed.merchandiseCents,
      stripeFeeCents: payment.feeCents,
      platformFeeBps: platformFeeBps(),
      groups,
      address: payment.address,
    },
    { suppliers: suppliers(), payments: payments() }
  )

  if (result.status === 'fulfilled') {
    const supplierTransferCents = result.transfers
      .filter(transfer => transfer.role === 'supplier')
      .reduce((sum, transfer) => sum + transfer.amountCents, 0)
    await saveFulfilledOrder({
      orderId,
      stripeFeeCents: result.split.stripeFeeCents,
      platformFeeCents: result.split.platformFeeCents,
      supplierCostCents: result.split.supplierCostCents,
      sellerTransferCents: result.split.sellerTransferCents,
      supplierTransferCents,
      sandbox: supplierOrdersMode() !== 'live',
      jobs: result.fulfillments.map(job => ({
        groupKey: job.groupId,
        provider: job.provider,
        supplierProfileId: groups.find(group => group.id === job.groupId)?.supplierProfileId ?? null,
        externalOrderId: job.externalOrderId,
        sandbox: job.sandbox,
      })),
      transfers: result.transfers.map(transfer => ({
        role: transfer.role,
        groupKey: transfer.groupId ?? null,
        stripeAccountId: transfer.destinationAccountId,
        amountCents: transfer.amountCents,
        stripeTransferId: transfer.stripeTransferId,
      })),
    })
    await notifyDirectSuppliers(orderId, groups)
    return
  }

  const status = result.status === 'failed'
    ? 'failed'
    : result.supplierRejected || result.outOfStock
      ? 'supplier_rejected'
      : 'refunded'
  await saveRefundedOrder(orderId, status, result.reason)
}

export async function fulfillExternalOrder(input: {
  orderId: string
  externalPaymentId: string
  grossCents: number
  feeCents: number
  address: ShippingAddress
  refund: () => Promise<void>
}): Promise<{ status: 'fulfilled' | 'refunded' | 'failed' | 'skipped'; reason?: string }> {
  const claimed = await claimOrder(input.orderId)
  if (!claimed) return { status: 'skipped', reason: 'This channel order is already being fulfilled.' }
  if (input.grossCents !== claimed.grossCents) {
    await input.refund()
    await saveRefundedOrder(input.orderId, 'refunded', 'Paid amount does not match the order total.')
    return { status: 'refunded', reason: 'Paid amount does not match the order total.' }
  }

  await markOrderPayment({
    orderId: input.orderId,
    paymentIntentId: input.externalPaymentId,
    chargeId: input.externalPaymentId,
    address: input.address,
    grossCents: input.grossCents,
  })

  const groups = groupsFrom(claimed)
  const channelPayments: PaymentPort = {
    async refund() {
      await input.refund()
    },
    async transfer() {
      throw new Error('External channel orders do not create Stripe transfers.')
    },
    async reverseTransfer() {
      throw new Error('External channel orders have no Stripe transfer to reverse.')
    },
  }
  const result = await routePaidOrder(
    {
      orderId: input.orderId,
      paymentIntentId: input.externalPaymentId,
      sellerAccountId: claimed.sellerAccountId,
      grossCents: claimed.grossCents,
      merchandiseCents: claimed.merchandiseCents,
      stripeFeeCents: input.feeCents,
      platformFeeBps: platformFeeBps(),
      groups,
      address: input.address,
      payoutMode: 'channel_collected',
    },
    { suppliers: suppliers(), payments: channelPayments }
  )

  if (result.status === 'fulfilled') {
    await saveFulfilledOrder({
      orderId: input.orderId,
      stripeFeeCents: result.split.stripeFeeCents,
      platformFeeCents: result.split.platformFeeCents,
      supplierCostCents: result.split.supplierCostCents,
      sellerTransferCents: result.split.sellerTransferCents,
      supplierTransferCents: 0,
      sandbox: supplierOrdersMode() !== 'live',
      jobs: result.fulfillments.map(job => ({
        groupKey: job.groupId,
        provider: job.provider,
        supplierProfileId: groups.find(group => group.id === job.groupId)?.supplierProfileId ?? null,
        externalOrderId: job.externalOrderId,
        sandbox: job.sandbox,
      })),
      transfers: [],
    })
    await notifyDirectSuppliers(input.orderId, groups)
    return { status: 'fulfilled' }
  }

  const status = result.status === 'failed'
    ? 'failed'
    : result.supplierRejected || result.outOfStock
      ? 'supplier_rejected'
      : 'refunded'
  await saveRefundedOrder(input.orderId, status, result.reason)
  return { status: result.status === 'failed' ? 'failed' : 'refunded', reason: result.reason }
}

export async function compensateRefundedCharge(paymentIntentId: string): Promise<void> {
  const orderId = await orderIdForPaymentIntent(paymentIntentId)
  if (!orderId) return
  const transfers = await listOrderTransfers(orderId)
  const fulfillments = await takeOpenFulfillments(orderId)
  const result = await compensateAfterRefund(
    {
      orderId,
      transfers,
      fulfillments: fulfillments.map(job => ({
        externalOrderId: job.externalOrderId,
        group: {
          id: job.groupKey,
          orderNumber: orderNumber(orderId, job.groupKey),
          provider: job.provider,
          settlement: settlementFor(job.provider),
          supplierProfileId: job.supplierProfileId,
          costCents: 0,
          items: job.items.map(item => ({
            variantId: item.externalVariantId,
            productId: item.externalProductId,
            supplierProductId: item.supplierProductId,
            quantity: item.quantity,
            storeLineItemId: item.id,
            title: item.title,
          })),
        },
      })),
    },
    { suppliers: suppliers(), payments: payments() }
  )
  for (const reversal of result.reversals) {
    await markTransferReversed(reversal.transferId, reversal.reversalId)
  }
  await saveRefundedOrder(orderId, 'refunded', 'Payment was refunded and payouts were reversed.')
}

export async function refundSellerOrder(orderId: string, paymentIntentId: string): Promise<void> {
  await payments().refund({
    paymentIntentId,
    idempotencyKey: `store-refund-${orderId}`,
  })
  await compensateRefundedCharge(paymentIntentId)
}

export async function refreshSupplierTracking(): Promise<{ checked: number; updated: number }> {
  const jobs = await listJobsNeedingTracking()
  let updated = 0
  for (const job of jobs) {
    try {
      const tracking = await supplierGateway(job.provider).tracking(job.externalOrderId)
      if (!tracking?.trackingNumber) continue
      await saveTracking(job.id, {
        trackingNumber: tracking.trackingNumber,
        trackingUrl: tracking.trackingUrl,
        carrier: tracking.carrier,
      })
      updated += 1
    } catch {
      // A single supplier miss should not stop the rest of the poll.
    }
  }
  return { checked: jobs.length, updated }
}
