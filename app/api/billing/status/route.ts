import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { PLAN_LIMITS } from '@/lib/billing'
import { getBillingProfile } from '@/lib/db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getBillingProfile(user.id)
  const plan = profile?.plan === 'pro' ? 'pro' : 'free'

  return NextResponse.json({
    plan,
    status: profile?.stripe_subscription_status ?? null,
    hasCustomer: Boolean(profile?.stripe_customer_id),
    limits: PLAN_LIMITS[plan],
  })
}
