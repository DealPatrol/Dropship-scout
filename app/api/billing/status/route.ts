import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { PLAN_LIMITS } from '@/lib/billing'
import { getBillingProfile } from '@/lib/db'
import { expireLapsedAppleSubscription } from '@/lib/apple/subscription-db'
import { stripeBillingConfigured } from '@/lib/stripe'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await expireLapsedAppleSubscription(user.id).catch(() => undefined)
  const profile = await getBillingProfile(user.id)
  const plan = profile?.plan === 'pro' ? 'pro' : 'free'
  const stripeActive = profile?.stripe_subscription_status === 'active' || profile?.stripe_subscription_status === 'trialing'
  const appleLinked = Boolean(profile?.apple_original_transaction_id)
  const source = plan !== 'pro' ? null : stripeActive ? 'stripe' : appleLinked ? 'apple' : 'stripe'

  return NextResponse.json({
    plan,
    status: profile?.stripe_subscription_status ?? null,
    hasCustomer: Boolean(profile?.stripe_customer_id),
    limits: PLAN_LIMITS[plan],
    checkoutAvailable: stripeBillingConfigured(),
    source,
    apple: appleLinked
      ? {
          productId: profile?.apple_product_id ?? null,
          expiresAt: profile?.apple_expires_at ? new Date(profile.apple_expires_at).toISOString() : null,
          revoked: Boolean(profile?.apple_revoked_at),
        }
      : null,
  })
}
