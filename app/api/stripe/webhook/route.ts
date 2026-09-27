import type Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { hasStripeEvent, recordStripeEvent, updateStripeSubscription } from '@/lib/db'
import { planForSubscriptionStatus } from '@/lib/billing'
import { getStripe, stripeWebhookSecret } from '@/lib/stripe'

function resourceId(value: string | { id: string } | null): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

async function processCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id || undefined
  const customerId = resourceId(session.customer)
  const subscriptionId = resourceId(session.subscription)
  if (!userId || !customerId || !subscriptionId) return

  await updateStripeSubscription({
    userId,
    customerId,
    subscriptionId,
    status: 'active',
    plan: 'pro',
  })
}

async function processSubscription(subscription: Stripe.Subscription) {
  const customerId = resourceId(subscription.customer)
  if (!customerId) return

  await updateStripeSubscription({
    userId: subscription.metadata.userId || undefined,
    customerId,
    subscriptionId: subscription.id,
    status: subscription.status,
    plan: planForSubscriptionStatus(subscription.status),
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
      await processCheckout(event.data.object)
    } else if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await processSubscription(event.data.object)
    }

    await recordStripeEvent(event.id, event.type)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Stripe webhook processing failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
