import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkoutGate, parseBillingInterval, publicCheckoutError } from '@/lib/billing'
import { getBillingProfile, saveWatchSubscriber, setStripeCustomer } from '@/lib/db'
import { siteUrl } from '@/lib/site'
import {
  checkoutIntegrationIdentifier,
  getStripe,
  priceIdForInterval,
} from '@/lib/stripe'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = await request.text()
  let interval = parseBillingInterval(undefined)
  if (raw.trim()) {
    try {
      const body = JSON.parse(raw) as { interval?: unknown }
      interval = parseBillingInterval(body?.interval)
    } catch {
      return NextResponse.json({ error: 'Checkout interval was not valid JSON.' }, { status: 400 })
    }
  }

  const gate = checkoutGate({
    interval,
    secretConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    monthlyPriceConfigured: Boolean(process.env.STRIPE_PRO_PRICE_ID?.trim()),
    annualPriceConfigured: Boolean(process.env.STRIPE_PRO_ANNUAL_PRICE_ID?.trim()),
  })
  if (gate === 'waitlist') {
    let saved = true
    try {
      await saveWatchSubscriber(user.email, 'pro-waitlist')
    } catch {
      saved = false
    }
    return NextResponse.json({ waitlist: true, saved })
  }
  if (gate === 'annual_missing') {
    return NextResponse.json(
      { error: 'Annual billing is not available right now. Monthly checkout is still open.' },
      { status: 409 },
    )
  }

  try {
    const stripe = getStripe()
    const profile = await getBillingProfile(user.id)
    if (
      profile?.plan === 'pro' ||
      profile?.stripe_subscription_status === 'active' ||
      profile?.stripe_subscription_status === 'trialing'
    ) {
      return NextResponse.json(
        { error: 'An active Pro subscription already exists. Use Manage billing.' },
        { status: 409 }
      )
    }
    let customerId = profile?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      }, {
        idempotencyKey: `dropship-scout-customer-${user.id}`,
      })
      customerId = customer.id
      await setStripeCustomer(user.id, customerId)
    }

    const appUrl = siteUrl()
    const priceId = priceIdForInterval(interval)
    const checkoutWindow = Math.floor(Date.now() / (60 * 60 * 1000))
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?billing=success`,
      cancel_url: `${appUrl}/dashboard/settings?billing=cancelled`,
      client_reference_id: user.id,
      metadata: { userId: user.id, interval },
      subscription_data: { metadata: { userId: user.id, interval } },
      integration_identifier: checkoutIntegrationIdentifier(user.id),
    }, {
      idempotencyKey: `dropship-scout-checkout-${user.id}-${priceId}-${checkoutWindow}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const failure = publicCheckoutError(err)
    return NextResponse.json({ error: failure.message }, { status: failure.status })
  }
}
