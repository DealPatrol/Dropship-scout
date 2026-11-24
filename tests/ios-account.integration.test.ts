/**
 * Exercises App Store entitlement storage and in-app account deletion against a
 * throwaway test database:
 * DATABASE_URL=<test database> RUN_IOS_DB_TESTS=1 npm test -- tests/ios-account.integration.test.ts
 */
import { randomUUID } from 'crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { createUser } from '@/lib/auth'
import { sql } from '@/lib/database'
import { AccountDeletionBlockedError, deleteAccount } from '@/lib/account-deletion'
import { createListing, createSupplierProfile, saveStoreProfile, upsertSupplierProduct } from '@/lib/store-db'
import {
  AppleLinkConflictError,
  applyAppleNotificationTransaction,
  applyAppleTransaction,
  expireLapsedAppleSubscription,
  getAppleState,
  recordAppleNotification,
} from '@/lib/apple/subscription-db'
import type { AppleTransactionPayload } from '@/lib/apple/app-store-jws'

const enabled = Boolean(process.env.DATABASE_URL) && process.env.RUN_IOS_DB_TESTS === '1' && process.env.NODE_ENV !== 'production'
const suffix = randomUUID().slice(0, 8)
const created: string[] = []

const tx = (overrides: Partial<AppleTransactionPayload> = {}): AppleTransactionPayload => ({
  transactionId: `t-${suffix}-${Math.random()}`,
  originalTransactionId: `o-${suffix}`,
  bundleId: 'com.colecollins.dropshipscout',
  productId: 'com.colecollins.dropshipscout.pro.monthly',
  purchaseDate: Date.now(),
  expiresDate: Date.now() + 30 * 86_400_000,
  signedDate: Date.now(),
  environment: 'Sandbox',
  type: 'Auto-Renewable Subscription',
  ...overrides,
} as AppleTransactionPayload)

const plan = async (id: string) => (await sql`select plan from users where id = ${id}`)[0]?.plan

describe.skipIf(!enabled)('iOS subscriptions and account deletion', () => {
  afterAll(async () => {
    if (created.length) await sql`delete from users where id in ${sql(created)}`
    await sql.end({ timeout: 1 })
  })

  it('grants, renews, ignores stale payloads and expires Apple Pro', async () => {
    const user = await createUser(`ios-${suffix}@example.com`, 'password123')
    created.push(user.id)
    const first = tx({ signedDate: 1_000 })
    expect((await applyAppleTransaction(user.id, first)).plan).toBe('pro')
    expect((await getAppleState(user.id))?.originalTransactionId).toBe(`o-${suffix}`)

    // An older signed payload must not overwrite newer state.
    await applyAppleTransaction(user.id, tx({ signedDate: 500, expiresDate: Date.now() - 10 * 86_400_000 }))
    expect(await plan(user.id)).toBe('pro')

    // Expired beyond the grace window, newer payload: back to free.
    expect((await applyAppleTransaction(user.id, tx({ signedDate: 2_000, expiresDate: Date.now() - 10 * 86_400_000 }))).plan).toBe('free')

    // Renewal via App Store Server Notification found by originalTransactionId.
    expect(await applyAppleNotificationTransaction(tx({ signedDate: 3_000 }))).toBe(true)
    expect(await plan(user.id)).toBe('pro')

    // Missed notification: status check expires it.
    await sql`update users set apple_expires_at = now() - interval '10 days' where id = ${user.id}`
    await expireLapsedAppleSubscription(user.id)
    expect(await plan(user.id)).toBe('free')
  })

  it('refuses to link one App Store subscription to two accounts', async () => {
    const other = await createUser(`ios-other-${suffix}@example.com`, 'password123')
    created.push(other.id)
    await expect(applyAppleTransaction(other.id, tx({ signedDate: 9_000 }))).rejects.toBeInstanceOf(AppleLinkConflictError)
  })

  it('deduplicates server notifications', async () => {
    const uuid = randomUUID()
    expect(await recordAppleNotification(uuid, 'DID_RENEW')).toBe(true)
    expect(await recordAppleNotification(uuid, 'DID_RENEW')).toBe(false)
    await sql`delete from apple_notifications where notification_uuid = ${uuid}`
  })

  it('deletes the account and owned data, and reports linked Apple subscriptions', async () => {
    const email = `ios-delete-${suffix}@example.com`
    const user = await createUser(email, 'password123')
    created.push(user.id)
    await applyAppleTransaction(user.id, tx({ originalTransactionId: `del-${suffix}`, signedDate: 1 }))
    await sql`insert into watch_subscribers (email, source) values (${email}, 'test') on conflict do nothing`.catch(() => undefined)

    const result = await deleteAccount(user.id)
    expect(result).toMatchObject({ deleted: true, stripeSubscriptionCancelled: false, appleSubscriptionLinked: true })
    expect((await sql`select 1 from users where id = ${user.id}`).length).toBe(0)
    expect((await sql`select 1 from watch_subscribers where email = ${email}`).length).toBe(0)
  })

  it('deletes a supplier and a seller without breaking the other side of the marketplace', async () => {
    const seller = await createUser(`ios-seller-${suffix}@example.com`, 'password123')
    const supplierUser = await createUser(`ios-supplier-${suffix}@example.com`, 'password123')
    created.push(seller.id, supplierUser.id)
    await saveStoreProfile({ userId: seller.id, storeName: 'Del Goods', storeSlug: `del-${suffix}`, storePublished: true })
    const supplier = await createSupplierProfile({ userId: supplierUser.id, displayName: 'Del Supply', slug: `del-supply-${suffix}` })
    const productId = await upsertSupplierProduct({
      provider: 'direct', externalId: `del-sku-${suffix}`, variantId: `del-var-${suffix}`, supplierProfileId: supplier.id,
      title: 'Mug', description: 'Mug', imageUrl: null, costCents: 500, shippingCents: 200, stock: 5, available: true,
    })
    const listingId = await createListing({
      sellerUserId: seller.id, supplierProductId: productId, title: 'Mug', description: 'Mug', priceCents: 1500, slug: `mug-${suffix}`, published: true,
    })
    const [order] = await sql`
      insert into store_orders (seller_user_id, public_token, status, sandbox, merchandise_cents, shipping_cents, gross_cents)
      values (${seller.id}, ${`tok-${suffix}`}, 'paid', false, 1500, 0, 1500) returning id
    `
    await sql`
      insert into store_order_items (order_id, listing_id, supplier_product_id, title, quantity, unit_price_cents)
      values (${order.id}, ${listingId}, ${productId}, 'Mug', 1, 1500)
    `.catch(() => undefined)

    // The supplier can leave: the product is detached and made unavailable, the seller listing survives.
    await deleteAccount(supplierUser.id)
    const product = await sql`select supplier_profile_id, available from supplier_products where id = ${productId}`
    expect(product[0]).toMatchObject({ supplier_profile_id: null, available: false })
    expect((await sql`select 1 from store_listings where id = ${listingId}`).length).toBe(1)

    // The seller cannot delete while a live paid order is in flight.
    await expect(deleteAccount(seller.id)).rejects.toBeInstanceOf(AccountDeletionBlockedError)
    await sql`update store_orders set status = 'fulfilled' where id = ${order.id}`
    await deleteAccount(seller.id)
    expect((await sql`select 1 from store_listings where id = ${listingId}`).length).toBe(0)
    expect((await sql`select 1 from store_orders where seller_user_id = ${seller.id}`).length).toBe(0)
  })
})
