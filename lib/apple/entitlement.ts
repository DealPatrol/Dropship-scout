// lib/apple/entitlement.ts
// Pure rules for turning verified StoreKit 2 transactions into a Pro entitlement.

import { IOS_BUNDLE_ID, isIosProProductId } from '@/lib/native/platform'
import type { AppleTransactionPayload } from './app-store-jws'

/** Billing retry grace after an expiry before Pro is removed. */
export const APPLE_GRACE_MS = 3 * 24 * 60 * 60 * 1000

export type TransactionCheck =
  | { ok: true; tx: AppleTransactionPayload }
  | { ok: false; reason: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function checkTransactionForUser(tx: AppleTransactionPayload, userId: string, linkedOriginalId: string | null): TransactionCheck {
  if (tx.bundleId !== IOS_BUNDLE_ID) return { ok: false, reason: 'Transaction is for a different app' }
  if (!isIosProProductId(tx.productId)) return { ok: false, reason: 'Unknown product' }
  if (typeof tx.originalTransactionId !== 'string' || !tx.originalTransactionId) return { ok: false, reason: 'Missing original transaction id' }
  const token = typeof tx.appAccountToken === 'string' ? tx.appAccountToken.toLowerCase() : null
  if (token && UUID.test(token)) {
    if (token !== userId.toLowerCase()) return { ok: false, reason: 'This App Store subscription belongs to a different Dropship Scout account' }
  } else if (linkedOriginalId !== tx.originalTransactionId) {
    // No account token: only accept if this subscription is already linked to this account.
    return { ok: false, reason: 'This App Store subscription is not linked to this account' }
  }
  return { ok: true, tx }
}

export function isActive(tx: Pick<AppleTransactionPayload, 'expiresDate' | 'revocationDate'>, now = Date.now()): boolean {
  if (tx.revocationDate) return false
  return typeof tx.expiresDate === 'number' && tx.expiresDate + APPLE_GRACE_MS > now
}

/** The transaction that decides the entitlement: latest expiry, revoked ones last. */
export function pickEntitlement(txs: AppleTransactionPayload[]): AppleTransactionPayload | null {
  if (txs.length === 0) return null
  return txs.slice().sort((a, b) => {
    const ar = a.revocationDate ? 1 : 0
    const br = b.revocationDate ? 1 : 0
    if (ar !== br) return ar - br
    return (b.expiresDate ?? 0) - (a.expiresDate ?? 0)
  })[0]
}
