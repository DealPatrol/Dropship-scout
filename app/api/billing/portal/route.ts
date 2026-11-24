import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isNativeIosUserAgent } from '@/lib/native/platform'
import { publicCheckoutError } from '@/lib/billing'
import { getBillingProfile } from '@/lib/db'
import { siteUrl } from '@/lib/site'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  // App Review Guideline 3.1.1: the iOS app sells Pro only through StoreKit.
  if (isNativeIosUserAgent(request.headers.get('user-agent'))) {
    return NextResponse.json({ error: 'In the iOS app, Pro is available as an App Store subscription in Settings.' }, { status: 403 })
  }

  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const profile = await getBillingProfile(user.id)
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const appUrl = siteUrl()
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const failure = publicCheckoutError(err)
    const message = failure.status === 503
      ? failure.message
      : 'Could not open billing portal'
    return NextResponse.json({ error: message }, { status: failure.status === 503 ? 503 : 500 })
  }
}
