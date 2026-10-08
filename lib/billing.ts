export type Plan = 'free' | 'pro'

export type BillingInterval = 'month' | 'year'

export function parseBillingInterval(value: unknown): BillingInterval {
  return value === 'year' ? 'year' : 'month'
}

export function proAuthHref(path: '/auth/sign-up' | '/auth/login', interval: BillingInterval): string {
  return interval === 'year' ? `${path}?plan=pro&interval=year` : `${path}?plan=pro`
}

export function settingsCheckoutSearch(interval: BillingInterval): string {
  return interval === 'year' ? '?checkout=1&interval=year' : '?checkout=1'
}

export type CheckoutGate = 'ready' | 'waitlist' | 'annual_missing'

/** Signed-in checkout when Stripe keys are missing should waitlist, not 503. */
export function checkoutGate(input: {
  interval: BillingInterval
  secretConfigured: boolean
  monthlyPriceConfigured: boolean
  annualPriceConfigured: boolean
}): CheckoutGate {
  if (!input.secretConfigured || !input.monthlyPriceConfigured) return 'waitlist'
  if (input.interval === 'year' && !input.annualPriceConfigured) return 'annual_missing'
  switch (input.interval) {
    case 'month':
    case 'year':
      return 'ready'
    default: {
      const exhaustive: never = input.interval
      return exhaustive
    }
  }
}

export const PRO_WAITLIST_SAVED = 'Pro is launching soon. Your account email is on the waitlist.'
export const PRO_WAITLIST_UNSAVED = 'Pro is launching soon. The waitlist could not be saved just now. Try again in a moment.'

/** Picks the Stripe Price id. Throws the same missing-env error shape as the Stripe client. */
export function selectProPriceId(
  interval: BillingInterval,
  prices: { month: string; year: string | null }
): string {
  if (interval === 'year') {
    if (!prices.year) throw new Error('Missing required environment variable: STRIPE_PRO_ANNUAL_PRICE_ID')
    return prices.year
  }
  if (!prices.month) throw new Error('Missing required environment variable: STRIPE_PRO_PRICE_ID')
  return prices.month
}

export interface PlanLimits {
  savedProducts: number | null
  catalogProducts: number | null
  catalogBuildSize: number | null
  shopifyPushesPerMonth: number | null
  liveSupplierData: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    savedProducts: 10,
    catalogProducts: 25,
    catalogBuildSize: 10,
    shopifyPushesPerMonth: 3,
    liveSupplierData: false,
  },
  pro: {
    savedProducts: null,
    catalogProducts: null,
    catalogBuildSize: null,
    shopifyPushesPerMonth: null,
    liveSupplierData: true,
  },
}

export class PlanLimitError extends Error {}

const PRO_STATUSES = new Set(['active', 'trialing'])

export function planForSubscriptionStatus(status: string | null | undefined): Plan {
  return status && PRO_STATUSES.has(status) ? 'pro' : 'free'
}

export function limitExceeded(current: number, incoming: number, limit: number | null): boolean {
  return limit !== null && current + incoming > limit
}

export function planLimitMessage(resource: string, limit: number): string {
  return `Free plan limit reached: ${limit} ${resource}. Upgrade to Pro for unlimited access.`
}

/** Buyer-facing checkout failure. Does not include env var names or secrets. */
export function publicCheckoutError(err: unknown): { message: string; status: number } {
  const message = err instanceof Error ? err.message : 'Could not start checkout'
  if (message.startsWith('Missing required environment variable:')) {
    return {
      message: 'Pro checkout is not configured yet. Stripe billing keys are missing on this deployment.',
      status: 503,
    }
  }
  return { message, status: 500 }
}
