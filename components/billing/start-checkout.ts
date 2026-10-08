'use client'

import { track } from '@vercel/analytics'

export async function startProCheckout(source: string): Promise<string> {
  const response = await fetch('/api/billing/checkout', { method: 'POST' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || typeof data.url !== 'string' || data.url.length === 0) {
    const message = typeof data.error === 'string' ? data.error : 'Could not start checkout'
    throw new Error(message)
  }
  try {
    track('checkout-started', { source })
  } catch {
    // Analytics must not block Stripe Checkout.
  }
  return data.url
}
