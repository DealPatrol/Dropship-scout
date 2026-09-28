import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSlug } from '@/lib/commerce/money'
import { getStoreProfile, saveStoreProfile, setConnectAccount } from '@/lib/store-db'
import { recipientTransfersStatus, retrieveRecipientAccount } from '@/lib/connect'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getStoreProfile(user.id)
  if (profile?.stripeAccountId) {
    try {
      const account = await retrieveRecipientAccount(profile.stripeAccountId)
      const status = recipientTransfersStatus(account)
      if (status !== profile.connectTransfersStatus) {
        await setConnectAccount(user.id, profile.stripeAccountId, status)
        profile.connectTransfersStatus = status
      }
    } catch {
      // Keep the last known status when Stripe is unreachable.
    }
  }
  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as {
    storeName?: string
    storeSlug?: string
    storePublished?: boolean
  } | null
  const storeName = body?.storeName?.trim() ?? ''
  const storeSlug = body?.storeSlug?.trim().toLowerCase() ?? ''
  if (storeName.length < 2 || storeName.length > 60) {
    return NextResponse.json({ error: 'Store name must be 2–60 characters.' }, { status: 400 })
  }
  if (!isSlug(storeSlug)) {
    return NextResponse.json({ error: 'Store link must be 3–40 characters: lowercase letters, numbers, and hyphens.' }, { status: 400 })
  }
  const current = await getStoreProfile(user.id)
  const wantsPublish = Boolean(body?.storePublished)
  if (wantsPublish && current?.connectTransfersStatus !== 'active') {
    return NextResponse.json({ error: 'Connect payouts before publishing the storefront.' }, { status: 409 })
  }
  try {
    const profile = await saveStoreProfile({
      userId: user.id,
      storeName,
      storeSlug,
      storePublished: wantsPublish,
    })
    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save store' }, { status: 400 })
  }
}
