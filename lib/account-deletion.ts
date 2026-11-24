// lib/account-deletion.ts
// In-app account deletion (App Review Guideline 5.1.1(v)). Deletes the account
// and everything it owns: saved products, catalogs, launches, the hosted store,
// its listings and orders, channel credentials and any supplier profile.
// A Stripe Pro subscription is cancelled first so billing stops. App Store
// subscriptions are managed by Apple and must be cancelled by the user in
// iOS Settings; the response says so.

import { ensureSchema, sql } from './database'
import { getStripe } from './stripe'

/** Paid live orders that a supplier is still working on. */
export const IN_FLIGHT_ORDER_STATUSES = ['paid', 'fulfilling'] as const

export class AccountDeletionBlockedError extends Error {}

export interface AccountDeletionResult {
  deleted: true
  stripeSubscriptionCancelled: boolean
  /** True when an App Store subscription was linked; the user must cancel it in iOS Settings. */
  appleSubscriptionLinked: boolean
}

const CANCELLABLE = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete'])

export async function deleteAccount(userId: string): Promise<AccountDeletionResult> {
  await ensureSchema()
  const rows = await sql`
    select email, stripe_subscription_id, stripe_subscription_status, apple_original_transaction_id, apple_expires_at, apple_revoked_at
    from users where id = ${userId}
  `
  const user = rows[0]
  if (!user) throw new AccountDeletionBlockedError('Account not found')

  const inFlight = await sql`
    select count(*)::int as count from store_orders
    where seller_user_id = ${userId} and sandbox = false and status in ${sql(IN_FLIGHT_ORDER_STATUSES as unknown as string[])}
  `
  if ((inFlight[0]?.count ?? 0) > 0) {
    throw new AccountDeletionBlockedError(
      'Your store has paid orders that suppliers are still fulfilling. Deletion is available once they ship or are refunded, or contact support to delete sooner.',
    )
  }

  let stripeSubscriptionCancelled = false
  if (user.stripe_subscription_id && CANCELLABLE.has(String(user.stripe_subscription_status))) {
    try {
      await getStripe().subscriptions.cancel(String(user.stripe_subscription_id), { prorate: false })
      stripeSubscriptionCancelled = true
    } catch (err) {
      const code = (err as { code?: string }).code
      // Already gone in Stripe: safe to continue.
      if (code !== 'resource_missing') {
        throw new AccountDeletionBlockedError('We could not cancel your Pro subscription in Stripe, so the account was not deleted. Try again, or contact support.')
      }
    }
  }

  await sql.begin(async t => {
    // Keep other sellers' order history intact if this account supplied them.
    await t`
      update supplier_products set supplier_profile_id = null, available = false
      where supplier_profile_id in (select id from supplier_profiles where user_id = ${userId})
    `
    await t`
      update store_order_items set listing_id = null
      where listing_id in (select id from store_listings where seller_user_id = ${userId})
    `
    // Orders do not cascade from users; their items, fulfillment jobs and payout rows do cascade from orders.
    await t`delete from store_orders where seller_user_id = ${userId}`
    // Product-watch email list entry for the same address.
    await t`delete from watch_subscribers where email = ${String(user.email)}`
    // Everything else references users(id) on delete cascade.
    await t`delete from users where id = ${userId}`
  })

  return {
    deleted: true,
    stripeSubscriptionCancelled,
    appleSubscriptionLinked: Boolean(user.apple_original_transaction_id) && !user.apple_revoked_at,
  }
}
