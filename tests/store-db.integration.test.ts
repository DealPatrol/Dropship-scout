import { randomUUID } from 'crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { createUser } from '@/lib/auth'
import { cancelDirectOrder, placeDirectOrder } from '@/lib/supplier-api/direct'
import { sql } from '@/lib/database'
import {
  claimOrder,
  createListing,
  createPendingOrder,
  createSupplierProfile,
  getPublishedListing,
  getPublishedStore,
  getSupplierProduct,
  listSellerListings,
  saveStoreProfile,
  takeOpenFulfillments,
  upsertSupplierProduct,
} from '@/lib/store-db'

const databaseUrl = process.env.DATABASE_URL
const suffix = randomUUID().slice(0, 8)
const sellerIds: string[] = []

describe.skipIf(!databaseUrl)('store database', () => {
  afterAll(async () => {
    if (!databaseUrl || sellerIds.length === 0) return
    await sql`delete from store_orders where seller_user_id in ${sql(sellerIds)}`
    await sql`delete from store_listings where seller_user_id in ${sql(sellerIds)}`
    await sql`delete from users where id in ${sql(sellerIds)}`
  })

  it('publishes a direct-supplier listing and reserves stock once', async () => {
    const seller = await createUser(`seller-${suffix}@example.com`, 'password')
    const supplierUser = await createUser(`supplier-${suffix}@example.com`, 'password')
    sellerIds.push(seller.id, supplierUser.id)

    await saveStoreProfile({
      userId: seller.id,
      storeName: 'Harbor Goods',
      storeSlug: `harbor-${suffix}`,
      storePublished: true,
    })
    const supplier = await createSupplierProfile({
      userId: supplierUser.id,
      displayName: 'Northwind Supply',
      slug: `northwind-${suffix}`,
    })
    const productId = await upsertSupplierProduct({
      provider: 'direct',
      externalId: `sku-${suffix}`,
      variantId: `var-${suffix}`,
      supplierProfileId: supplier.id,
      title: 'Canvas tote',
      description: 'A supplier-owned tote.',
      imageUrl: null,
      costCents: 1200,
      shippingCents: 400,
      stock: 3,
      available: true,
    })

    const listingId = await createListing({
      sellerUserId: seller.id,
      supplierProductId: productId,
      title: 'Canvas tote',
      description: 'A supplier-owned tote.',
      priceCents: 3200,
      slug: `canvas-tote-${suffix}`,
      published: true,
    })

    const store = await getPublishedStore(`harbor-${suffix}`)
    expect(store?.listings.map(listing => listing.id)).toEqual([listingId])
    expect(store?.listings[0]?.provider).toBe('direct')
    const listing = await getPublishedListing(`harbor-${suffix}`, listingId)
    expect(listing?.costCents).toBe(1200)
    expect((await listSellerListings(seller.id))[0]?.supplierProfileId).toBe(supplier.id)
    expect((await getSupplierProduct(productId))?.stock).toBe(3)
    expect((await getSupplierProduct(productId))?.supplierAccountId).toBeNull()
    await sql`update users set stripe_account_id = ${`acct_${suffix}`}, connect_transfers_status = 'active' where id = ${supplierUser.id}::uuid`
    expect((await getSupplierProduct(productId))?.supplierAccountId).toBe(`acct_${suffix}`)
    expect((await getSupplierProduct(productId))?.supplierTransfersStatus).toBe('active')

    const placed = await placeDirectOrder({
      id: supplier.id,
      orderNumber: `ord-${suffix}`,
      provider: 'direct',
      settlement: 'connected_account',
      supplierProfileId: supplier.id,
      costCents: 1600,
      items: [{
        variantId: `var-${suffix}`,
        supplierProductId: productId,
        quantity: 2,
        storeLineItemId: 'line-1',
        title: 'Canvas tote',
      }],
    }, {
      orderId: 'pending',
      paymentIntentId: 'pi_test',
      grossCents: 6800,
      merchandiseCents: 6400,
      stripeFeeCents: 227,
      platformFeeBps: 500,
      groups: [],
      address: {
        name: 'Ada Buyer',
        email: 'ada@example.com',
        address1: '1 Market St',
        city: 'San Francisco',
        province: 'CA',
        countryCode: 'US',
        country: 'United States',
        zip: '94105',
      },
    })
    expect(placed.status).toBe('accepted')
    expect((await getSupplierProduct(productId))?.stock).toBe(1)

    const rejected = await placeDirectOrder({
      id: supplier.id,
      orderNumber: `ord-${suffix}-2`,
      provider: 'direct',
      settlement: 'connected_account',
      costCents: 1600,
      items: [{
        variantId: `var-${suffix}`,
        supplierProductId: productId,
        quantity: 2,
        storeLineItemId: 'line-2',
        title: 'Canvas tote',
      }],
    }, {
      orderId: 'pending',
      paymentIntentId: 'pi_test',
      grossCents: 6800,
      merchandiseCents: 6400,
      stripeFeeCents: 227,
      platformFeeBps: 500,
      groups: [],
      address: {
        name: 'Ada Buyer',
        email: 'ada@example.com',
        address1: '1 Market St',
        city: 'San Francisco',
        province: 'CA',
        countryCode: 'US',
        country: 'United States',
        zip: '94105',
      },
    })
    expect(rejected).toMatchObject({ status: 'rejected', outOfStock: true })
    expect((await getSupplierProduct(productId))?.stock).toBe(1)

    await cancelDirectOrder({
      id: supplier.id,
      orderNumber: `ord-${suffix}`,
      provider: 'direct',
      settlement: 'connected_account',
      costCents: 1600,
      items: [{
        variantId: `var-${suffix}`,
        supplierProductId: productId,
        quantity: 2,
        storeLineItemId: 'line-1',
        title: 'Canvas tote',
      }],
    })
    expect((await getSupplierProduct(productId))?.stock).toBe(3)
  })

  it('claims a pending order once and cancels its fulfillment once', async () => {
    const seller = await createUser(`orders-${suffix}@example.com`, 'password')
    sellerIds.push(seller.id)
    const productId = await upsertSupplierProduct({
      provider: 'cj',
      externalId: `cj-${suffix}`,
      variantId: `cjv-${suffix}`,
      title: 'CJ mug',
      costCents: 500,
      shippingCents: 200,
      stock: null,
      available: true,
    })
    const listingId = await createListing({
      sellerUserId: seller.id,
      supplierProductId: productId,
      title: 'CJ mug',
      description: null,
      priceCents: 2000,
      slug: `cj-mug-${suffix}`,
      published: false,
    })
    const order = await createPendingOrder({
      sellerUserId: seller.id,
      merchandiseCents: 2000,
      shippingCents: 200,
      grossCents: 2200,
      items: [{
        listingId,
        supplierProductId: productId,
        provider: 'cj',
        supplierProfileId: null,
        title: 'CJ mug',
        quantity: 1,
        unitPriceCents: 2000,
        unitCostCents: 500,
        unitShippingCents: 200,
        externalProductId: `cj-${suffix}`,
        externalVariantId: `cjv-${suffix}`,
      }],
    })

    const claimed = await claimOrder(order.id)
    expect(claimed?.items[0]?.supplierProductId).toBe(productId)
    expect(await claimOrder(order.id)).toBeNull()

    await sql`
      insert into fulfillment_jobs (order_id, group_key, provider, external_order_id, status)
      values (${order.id}::uuid, 'cj', 'cj', ${`cj-order-${suffix}`}, 'accepted')
    `
    const first = await takeOpenFulfillments(order.id)
    expect(first).toHaveLength(1)
    expect(first[0]?.externalOrderId).toBe(`cj-order-${suffix}`)
    expect(await takeOpenFulfillments(order.id)).toEqual([])
  })
})
