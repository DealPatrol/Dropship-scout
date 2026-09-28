import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createRecipientDashboardLink } from '@/lib/connect'
import { getStoreProfile } from '@/lib/store-db'

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getStoreProfile(user.id)
  if (!profile?.stripeAccountId) {
    return NextResponse.json({ error: 'Connect payouts first.' }, { status: 409 })
  }
  try {
    const url = await createRecipientDashboardLink(profile.stripeAccountId)
    return NextResponse.json({ url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not open the payout dashboard' },
      { status: 500 }
    )
  }
}
