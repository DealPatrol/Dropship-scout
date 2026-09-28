export type OrdersMode = 'sandbox' | 'live'

export function supplierOrdersMode(): OrdersMode {
  return process.env.SUPPLIER_ORDERS_MODE === 'live' ? 'live' : 'sandbox'
}

export function platformFeeBps(): number {
  const raw = process.env.PLATFORM_FEE_BPS
  if (raw === undefined || raw === '') return 500
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5_000) {
    throw new Error('PLATFORM_FEE_BPS must be an integer from 0 to 5000')
  }
  return parsed
}

export function stripeFeeConfig(): { bps: number; fixedCents: number } {
  const bps = Number(process.env.STRIPE_FEE_BPS ?? 290)
  const fixedCents = Number(process.env.STRIPE_FEE_FIXED_CENTS ?? 30)
  return {
    bps: Number.isInteger(bps) && bps >= 0 ? bps : 290,
    fixedCents: Number.isInteger(fixedCents) && fixedCents >= 0 ? fixedCents : 30,
  }
}

/**
 * Storefront charges and Connect transfers stay in Stripe test mode unless a
 * live key and STRIPE_LIVE_MODE=true are both set. Billing subscriptions use
 * the same key, so a test key is the default for the whole app.
 */
export function assertCommercePaymentsAllowed(): void {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  const liveKey = key.startsWith('sk_live') || key.startsWith('rk_live')
  const liveFlag = process.env.STRIPE_LIVE_MODE === 'true'
  if (liveKey && !liveFlag) {
    throw new Error(
      'Refusing to move live money. Set STRIPE_LIVE_MODE=true only when you intend to charge live cards.'
    )
  }
  if (!liveKey && liveFlag) {
    throw new Error('STRIPE_LIVE_MODE=true requires a live Stripe secret key.')
  }
}

export function connectCountry(): string {
  return (process.env.CONNECT_ACCOUNT_COUNTRY || 'US').trim().toLowerCase() || 'us'
}

export interface QuoteAddress {
  countryCode: string
  region: string
  city: string
  postalCode: string
  address1: string
}

export function catalogQuoteAddress(): QuoteAddress {
  return {
    countryCode: (process.env.QUOTE_COUNTRY || 'US').trim().toUpperCase(),
    region: process.env.QUOTE_REGION || 'CA',
    city: process.env.QUOTE_CITY || 'Los Angeles',
    postalCode: process.env.QUOTE_POSTAL_CODE || '90036',
    address1: process.env.QUOTE_ADDRESS1 || '110 S Fairfax Ave',
  }
}
