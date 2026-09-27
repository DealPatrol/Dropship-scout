import { randomBytes } from 'crypto'
import Stripe from 'stripe'

let stripeClient: Stripe | undefined

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(requiredEnv('STRIPE_SECRET_KEY'), {
      appInfo: {
        name: 'Dropship Scout',
        version: '1.0.0',
      },
    })
  }
  return stripeClient
}

export function stripeWebhookSecret(): string {
  return requiredEnv('STRIPE_WEBHOOK_SECRET')
}

export function proPriceId(): string {
  return requiredEnv('STRIPE_PRO_PRICE_ID')
}

export function checkoutIntegrationIdentifier(): string {
  return `dropship_scout_${randomBytes(6).toString('base64url').slice(0, 8).toLowerCase()}`
}
