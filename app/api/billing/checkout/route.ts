import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getBillingProfile, setStripeCustomer } from '@/lib/db'
import {
  checkoutIntegrationIdentifier,
  getStripe,
  proPriceId,
} from '@/lib/stripe'

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const stripe = getStripe()
    const profile = await getBillingProfile(user.id)
    let customerId = profile?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await setStripeCustomer(user.id, customerId)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: proPriceId(), quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?billing=success`,
      cancel_url: `${appUrl}/dashboard/settings?billing=cancelled`,
      client_reference_id: user.id,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      integration_identifier: checkoutIntegrationIdentifier(),
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not start checkout' },
      { status: 500 }
    )
  }
}
