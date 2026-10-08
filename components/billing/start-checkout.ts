'use client'

import { track } from '@vercel/analytics'
import type { BillingInterval } from '@/lib/billing'

export type CheckoutStart =
  | { waitlist: false; url: string }
  | { waitlist: true; saved: boolean }

export async function startProCheckout(source: string, interval: BillingInterval = 'month'): Promise<CheckoutStart> {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interval }),
  })
  const data = await response.json().catch(() => ({}))
  if (response.ok && data.waitlist === true) {
    return { waitlist: true, saved: data.saved !== false }
  }
  if (!response.ok || typeof data.url !== 'string' || data.url.length === 0) {
    const message = typeof data.error === 'string' ? data.error : 'Could not start checkout'
    throw new Error(message)
  }
  try {
    track('checkout-started', { source, interval })
  } catch {
    // Analytics must not block Stripe Checkout.
  }
  return { waitlist: false, url: data.url }
}
