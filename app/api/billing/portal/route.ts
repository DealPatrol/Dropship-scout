import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getBillingProfile } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const profile = await getBillingProfile(user.id)
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not open billing portal' },
      { status: 500 }
    )
  }
}
