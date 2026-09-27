import type Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { hasStripeEvent, reconcileStripeSubscription, recordStripeEvent } from '@/lib/db'
import { planForSubscriptionStatus } from '@/lib/billing'
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

  await reconcileStripeSubscription({
    userId,
    subscriptionId,
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
}

async function processSubscription(subscription: Stripe.Subscription, eventCreated: number) {
  await reconcileStripeSubscription({
    userId: subscription.metadata.userId || undefined,
    subscriptionId: subscription.id,
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

    if (event.type === 'checkout.session.completed') {
      await processCheckout(event.data.object, event.created)
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
