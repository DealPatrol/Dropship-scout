// lib/apple/subscription-db.ts
// Persists App Store subscription state on the users row. Plan stays 'pro'
// while either an Apple subscription or a Stripe subscription is active.

import { ensureSchema, sql } from '@/lib/database'
import type { AppleTransactionPayload } from './app-store-jws'
import { APPLE_GRACE_MS, isActive } from './entitlement'

export interface AppleState {
  originalTransactionId: string | null
  productId: string | null
  expiresAt: string | null
  revokedAt: string | null
}

export async function getAppleState(userId: string): Promise<AppleState | null> {
  await ensureSchema()
  const rows = await sql`
    select apple_original_transaction_id, apple_product_id, apple_expires_at, apple_revoked_at
    from users where id = ${userId}
  `
  if (!rows[0]) return null
  return {
    originalTransactionId: rows[0].apple_original_transaction_id ?? null,
    productId: rows[0].apple_product_id ?? null,
    expiresAt: rows[0].apple_expires_at ? new Date(rows[0].apple_expires_at).toISOString() : null,
    revokedAt: rows[0].apple_revoked_at ? new Date(rows[0].apple_revoked_at).toISOString() : null,
  }
}

export class AppleLinkConflictError extends Error {}

/**
 * Applies a verified transaction to a user. Ignores payloads older than the one
 * already stored (signedDate), and refuses to move a subscription that is
 * already linked to another account.
 */
export async function applyAppleTransaction(userId: string, tx: AppleTransactionPayload): Promise<{ plan: 'free' | 'pro'; expiresAt: string | null }> {
  await ensureSchema()
  const expiresAt = typeof tx.expiresDate === 'number' ? new Date(tx.expiresDate) : null
  const revokedAt = typeof tx.revocationDate === 'number' ? new Date(tx.revocationDate) : null
  const active = isActive(tx)
  return sql.begin(async t => {
    await t`select pg_advisory_xact_lock(hashtext(${`apple:${tx.originalTransactionId}`}))`
    const owner = await t`select id from users where apple_original_transaction_id = ${tx.originalTransactionId} and id <> ${userId}`
    if (owner.length > 0) throw new AppleLinkConflictError('This App Store subscription is already linked to a different Dropship Scout account')
    const rows = await t`
      update users set
        apple_original_transaction_id = ${tx.originalTransactionId},
        apple_product_id = ${tx.productId},
        apple_expires_at = ${expiresAt},
        apple_revoked_at = ${revokedAt},
        apple_environment = ${tx.environment},
        apple_signed_date = ${tx.signedDate},
        plan = case
          when ${active} then 'pro'
          when stripe_subscription_status in ('active', 'trialing') then 'pro'
          else 'free'
        end
      where id = ${userId}
        and (apple_original_transaction_id is distinct from ${tx.originalTransactionId} or apple_signed_date <= ${tx.signedDate})
      returning plan, apple_expires_at
    `
    if (rows.length === 0) {
      const current = await t`select plan, apple_expires_at from users where id = ${userId}`
      return { plan: current[0]?.plan === 'pro' ? 'pro' : 'free', expiresAt: current[0]?.apple_expires_at ? new Date(current[0].apple_expires_at).toISOString() : null }
    }
    return { plan: rows[0].plan === 'pro' ? 'pro' : 'free', expiresAt: rows[0].apple_expires_at ? new Date(rows[0].apple_expires_at).toISOString() : null }
  }) as Promise<{ plan: 'free' | 'pro'; expiresAt: string | null }>
}

/** App Store Server Notification: update whichever account owns this subscription. */
export async function applyAppleNotificationTransaction(tx: AppleTransactionPayload): Promise<boolean> {
  await ensureSchema()
  const rows = await sql`
    select id from users
    where apple_original_transaction_id = ${tx.originalTransactionId}
       or (${tx.appAccountToken ?? null}::text is not null and id::text = lower(${tx.appAccountToken ?? ''}))
    limit 1
  `
  if (!rows[0]) return false
  await applyAppleTransaction(rows[0].id, tx)
  return true
}

/** Returns false when the notification was already processed. */
export async function recordAppleNotification(uuid: string, type: string): Promise<boolean> {
  await ensureSchema()
  const rows = await sql`
    insert into apple_notifications (notification_uuid, notification_type)
    values (${uuid}, ${type})
    on conflict (notification_uuid) do nothing
    returning notification_uuid
  `
  return rows.length > 0
}

/**
 * Removes Pro from accounts whose App Store subscription lapsed past the grace
 * window (in case a notification was missed) unless Stripe still bills them.
 */
export async function expireLapsedAppleSubscription(userId: string): Promise<void> {
  await ensureSchema()
  await sql`
    update users set plan = 'free'
    where id = ${userId}
      and plan = 'pro'
      and apple_original_transaction_id is not null
      and (apple_revoked_at is not null or apple_expires_at < ${new Date(Date.now() - APPLE_GRACE_MS)})
      and coalesce(stripe_subscription_status, '') not in ('active', 'trialing')
  `
}
