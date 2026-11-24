// POST /api/apple/notifications
// App Store Server Notifications V2 endpoint (set as the Production and Sandbox
// Server URL in App Store Connect). Renewals, expirations, refunds and
// revocations update the linked account even when the app is not opened.

import { NextResponse } from 'next/server'
import { AppleJwsError, verifyAppleJws, type AppleNotificationPayload, type AppleTransactionPayload } from '@/lib/apple/app-store-jws'
import { IOS_BUNDLE_ID, isIosProProductId } from '@/lib/native/platform'
import { applyAppleNotificationTransaction, recordAppleNotification } from '@/lib/apple/subscription-db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { signedPayload?: unknown } | null
  if (typeof body?.signedPayload !== 'string') return NextResponse.json({ error: 'Missing signedPayload' }, { status: 400 })

  let notification: AppleNotificationPayload
  try {
    notification = await verifyAppleJws<AppleNotificationPayload>(body.signedPayload)
  } catch (err) {
    if (err instanceof AppleJwsError) return NextResponse.json({ error: err.message }, { status: 400 })
    throw err
  }

  if (notification.data?.bundleId && notification.data.bundleId !== IOS_BUNDLE_ID) {
    return NextResponse.json({ ignored: 'different app' })
  }
  if (notification.notificationType === 'TEST') return NextResponse.json({ ok: true })
  const signedTx = notification.data?.signedTransactionInfo
  if (!signedTx) return NextResponse.json({ ignored: 'no transaction' })

  let tx: AppleTransactionPayload
  try {
    tx = await verifyAppleJws<AppleTransactionPayload>(signedTx)
  } catch (err) {
    if (err instanceof AppleJwsError) return NextResponse.json({ error: err.message }, { status: 400 })
    throw err
  }
  if (tx.bundleId !== IOS_BUNDLE_ID || !isIosProProductId(tx.productId)) return NextResponse.json({ ignored: 'unknown product' })

  // Apply before recording, so a failed update is retried by Apple.
  const linked = await applyAppleNotificationTransaction(tx)
  await recordAppleNotification(notification.notificationUUID, notification.notificationType)
  return NextResponse.json({ ok: true, linked })
}
