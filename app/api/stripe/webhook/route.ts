import type Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { compensateRefundedCharge, fulfillCheckoutSession } from '@/lib/commerce/process-order'
import { hasStripeEvent, queuePurchaseConversion, reconcileStripeSubscription, recordStripeEvent } from '@/lib/db'
import { planForSubscriptionStatus } from '@/lib/billing'
import { recipientTransfersStatus, retrieveRecipientAccount } from '@/lib/connect'
import { setConnectAccount, userIdForConnectAccount } from '@/lib/store-db'
import { getStripe, stripeWebhookSecret } from '@/lib/stripe'

function resourceId(value: string | { id: string } | null): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

async function processCheckout(session: Stripe.Checkout.Session, eventCreated: number) {
  const userId = session.metadata?.userId || session.client_reference_id || undefined
  const customerId = resourceId(session.customer)
  const subscriptionId = resourceId(session.subscription)
  if (!userId || !customerId || !subscriptionId) return

  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  await reconcileStripeSubscription({
    userId,
    subscriptionId,
    lockKey: `user:${userId}`,
    eventCreated,
    loadCurrent: async () => {
      const current = await getStripe().subscriptions.retrieve(subscriptionId)
      const currentCustomerId = resourceId(current.customer)
      if (!currentCustomerId) throw new Error('Stripe subscription has no customer')
      return {
        userId: current.metadata.userId || undefined,
        customerId: currentCustomerId,
        subscriptionId: current.id,
        status: current.status,
        plan: planForSubscriptionStatus(current.status),
      }
    },
  })
  if (!paid) return
  const amount = session.amount_total
  await queuePurchaseConversion({
    userId,
    transactionId: subscriptionId,
    valueCents: typeof amount === 'number' && Number.isInteger(amount) && amount > 0 ? amount : null,
    currency: session.currency ? session.currency.toLowerCase() : null,
  })
}

async function processSubscription(subscription: Stripe.Subscription, eventCreated: number) {
  const eventUserId = subscription.metadata.userId || undefined
  const eventCustomerId = resourceId(subscription.customer)
  if (!eventUserId && !eventCustomerId) return

  await reconcileStripeSubscription({
    userId: eventUserId,
    subscriptionId: subscription.id,
    lockKey: eventUserId ? `user:${eventUserId}` : `customer:${eventCustomerId}`,
    eventCreated,
    loadCurrent: async () => {
      const current = await getStripe().subscriptions.retrieve(subscription.id)
      const customerId = resourceId(current.customer)
      if (!customerId) throw new Error('Stripe subscription has no customer')
      return {
        userId: current.metadata.userId || undefined,
        customerId,
        subscriptionId: current.id,
        status: current.status,
        plan: planForSubscriptionStatus(current.status),
      }
    },
  })
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      await req.text(),
      signature,
      stripeWebhookSecret()
    )
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  try {
    if (await hasStripeEvent(event.id)) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    const eventType = event.type as string
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.metadata?.kind === 'storefront') {
        await fulfillCheckoutSession(session)
      } else {
        await processCheckout(session, event.created)
      }
    } else if (eventType === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
      if (paymentIntentId && charge.metadata?.kind === 'storefront') {
        await compensateRefundedCharge(paymentIntentId)
      } else if (paymentIntentId) {
        const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)
        if (paymentIntent.metadata?.kind === 'storefront') {
          await compensateRefundedCharge(paymentIntentId)
        }
      }
    } else if (eventType === 'v2.core.account.updated' || event.type === 'account.updated') {
      const accountId = (event.data.object as { id?: string }).id
      if (accountId?.startsWith('acct_')) {
        const userId = await userIdForConnectAccount(accountId)
        if (userId) {
          const account = await retrieveRecipientAccount(accountId)
          await setConnectAccount(userId, accountId, recipientTransfersStatus(account))
        }
      }
    } else if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await processSubscription(event.data.object, event.created)
    }

    await recordStripeEvent(event.id, event.type)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Stripe webhook processing failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
