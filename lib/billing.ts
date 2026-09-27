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
