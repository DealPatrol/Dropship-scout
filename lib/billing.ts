export type Plan = 'free' | 'pro'

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
