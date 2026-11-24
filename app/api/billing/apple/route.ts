// POST /api/billing/apple
// Called by the iOS app after a StoreKit 2 purchase, restore, or launch-time
// entitlement refresh. Verifies each signed transaction against Apple's root
// CA and links the subscription to the signed-in account.

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { AppleJwsError, verifyAppleJws, type AppleTransactionPayload } from '@/lib/apple/app-store-jws'
import { checkTransactionForUser, pickEntitlement } from '@/lib/apple/entitlement'
import { AppleLinkConflictError, applyAppleTransaction, getAppleState } from '@/lib/apple/subscription-db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Sign in to link your App Store subscription.' }, { status: 401 })

  const body = await request.json().catch(() => null) as { transactions?: unknown } | null
  const list = Array.isArray(body?.transactions) ? body.transactions.filter((t): t is string => typeof t === 'string').slice(0, 20) : []
  if (list.length === 0) return NextResponse.json({ error: 'No App Store transactions were sent.' }, { status: 400 })

  const state = await getAppleState(user.id)
  const accepted: AppleTransactionPayload[] = []
  let lastReason = 'The App Store transaction could not be verified.'
  for (const jws of list) {
    try {
      const tx = await verifyAppleJws<AppleTransactionPayload>(jws)
      const check = checkTransactionForUser(tx, user.id, state?.originalTransactionId ?? null)
      if (check.ok) accepted.push(check.tx)
      else lastReason = check.reason
    } catch (err) {
      if (!(err instanceof AppleJwsError)) throw err
      lastReason = err.message
    }
  }

  const chosen = pickEntitlement(accepted)
  if (!chosen) return NextResponse.json({ error: lastReason }, { status: 409 })

  try {
    const result = await applyAppleTransaction(user.id, chosen)
    return NextResponse.json({ plan: result.plan, source: 'apple', expiresAt: result.expiresAt })
  } catch (err) {
    if (err instanceof AppleLinkConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    throw err
  }
}
