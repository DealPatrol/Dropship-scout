import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  createRecipientAccount,
  createRecipientOnboardingLink,
  recipientTransfersStatus,
  retrieveRecipientAccount,
} from '@/lib/connect'
import { getStoreProfile, setConnectAccount } from '@/lib/store-db'

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const profile = await getStoreProfile(user.id)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    let accountId = profile.stripeAccountId
    if (!accountId) {
      accountId = await createRecipientAccount({
        email: profile.email,
        displayName: profile.storeName || profile.email,
        userId: profile.id,
      })
      await setConnectAccount(user.id, accountId, 'pending')
    } else {
      const account = await retrieveRecipientAccount(accountId)
      await setConnectAccount(user.id, accountId, recipientTransfersStatus(account))
    }
    const url = await createRecipientOnboardingLink(accountId)
    return NextResponse.json({ url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start payout onboarding' },
      { status: 500 }
    )
  }
}
