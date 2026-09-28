import type Stripe from 'stripe'
import { countryName } from './country'
import { estimateStripeFeeCents } from './money'
import type { ShippingAddress } from './types'
import { getStripe } from '@/lib/stripe'

export interface PaidCharge {
  paymentIntentId: string
  chargeId: string
  grossCents: number
  feeCents: number
  address: ShippingAddress
}

function resourceId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

export function addressFromCheckout(session: Stripe.Checkout.Session): ShippingAddress | null {
  const shipping = session.collected_information?.shipping_details
  const address = shipping?.address ?? session.customer_details?.address
  const email = session.customer_details?.email || session.customer_email
  if (!address?.line1 || !address.city || !address.country || !address.postal_code || !email) return null
  return {
    name: shipping?.name || session.customer_details?.name || 'Customer',
    email,
    phone: session.customer_details?.phone ?? undefined,
    address1: address.line1,
    address2: address.line2 ?? undefined,
    city: address.city,
    province: address.state || address.city,
    countryCode: address.country,
    country: countryName(address.country),
    zip: address.postal_code,
  }
}

export async function readPaidCharge(session: Stripe.Checkout.Session): Promise<PaidCharge | null> {
  const paymentIntentId = resourceId(session.payment_intent)
  const address = addressFromCheckout(session)
  if (!paymentIntentId || !address || session.payment_status !== 'paid') return null

  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge.balance_transaction'],
  })
  const charge = paymentIntent.latest_charge
  if (!charge || typeof charge === 'string') return null
  const balance = charge.balance_transaction
  const feeCents = balance && typeof balance !== 'string' ? balance.fee : estimateStripeFeeCents(charge.amount)
  return {
    paymentIntentId,
    chargeId: charge.id,
    grossCents: charge.amount,
    feeCents,
    address,
  }
}
