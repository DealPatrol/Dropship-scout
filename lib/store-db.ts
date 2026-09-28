import { randomUUID } from 'crypto'
import { ensureSchema, sql } from '@/lib/database'
import type { ShippingAddress } from '@/lib/commerce/types'
import { isSellableProvider, type SellableProvider } from '@/lib/commerce/types'

export interface StoreProfile {
  id: string
  email: string
  storeSlug: string | null
  storeName: string | null
  storePublished: boolean
  stripeAccountId: string | null
  connectTransfersStatus: string | null
}

export interface SupplierProfile {
  id: string
  userId: string
  displayName: string
  slug: string
  notifyUrl: string | null
  status: string
  stripeAccountId: string | null
  connectTransfersStatus: string | null
}

export interface SupplierProductRecord {
  id: string
  provider: SellableProvider
  externalId: string
  variantId: string
  supplierProfileId: string | null
  title: string
  description: string | null
  imageUrl: string | null
  costCents: number
  shippingCents: number
  sku: string | null
  stock: number | null
  available: boolean
  supplierName: string | null
}

export interface ListingRecord {
  id: string
  sellerUserId: string
  title: string
  description: string | null
  priceCents: number
  slug: string
  published: boolean
  supplierProductId: string
  provider: SellableProvider
  costCents: number
  shippingCents: number
  imageUrl: string | null
  available: boolean
  externalProductId: string
  externalVariantId: string
  supplierProfileId: string | null
  supplierAccountId: string | null
  supplierTransfersStatus: string | null
  supplierName: string | null
}

export interface PublicStore {
  sellerUserId: string
  storeSlug: string
  storeName: string
  payoutsReady: boolean
  listings: ListingRecord[]
}

function uniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505')
}

function mapProfile(row: Record<string, unknown>): StoreProfile {
  return {
    id: String(row.id),
    email: String(row.email),
    storeSlug: row.store_slug ? String(row.store_slug) : null,
    storeName: row.store_name ? String(row.store_name) : null,
    storePublished: Boolean(row.store_published),
    stripeAccountId: row.stripe_account_id ? String(row.stripe_account_id) : null,
    connectTransfersStatus: row.connect_transfers_status ? String(row.connect_transfers_status) : null,
  }
}

function listingSelect() {
  return sql`
    select
      l.id, l.seller_user_id, l.title, l.description, l.price_cents, l.slug, l.published,
      l.supplier_product_id,
      p.provider, p.cost_cents, p.shipping_cents, p.image_url, p.available,
      p.external_id, p.variant_id, p.supplier_profile_id,
      sp.display_name as supplier_name,
      su.stripe_account_id as supplier_account_id,
      su.connect_transfers_status as supplier_transfers_status
    from store_listings l
    join supplier_products p on p.id = l.supplier_product_id
    left join supplier_profiles sp on sp.id = p.supplier_profile_id
    left join users su on su.id = sp.user_id
  `
}

function mapListing(row: Record<string, unknown>): ListingRecord {
  const provider = String(row.provider)
  if (!isSellableProvider(provider)) {
    throw new Error(`Listing ${String(row.id)} is not tied to a sellable supplier.`)
  }
  return {
    id: String(row.id),
    sellerUserId: String(row.seller_user_id),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    priceCents: Number(row.price_cents),
    slug: String(row.slug),
    published: Boolean(row.published),
    supplierProductId: String(row.supplier_product_id),
    provider,
    costCents: Number(row.cost_cents),
    shippingCents: Number(row.shipping_cents),
    imageUrl: row.image_url ? String(row.image_url) : null,
    available: Boolean(row.available),
    externalProductId: String(row.external_id),
    externalVariantId: String(row.variant_id),
    supplierProfileId: row.supplier_profile_id ? String(row.supplier_profile_id) : null,
    supplierAccountId: row.supplier_account_id ? String(row.supplier_account_id) : null,
    supplierTransfersStatus: row.supplier_transfers_status ? String(row.supplier_transfers_status) : null,
    supplierName: row.supplier_name ? String(row.supplier_name) : null,
  }
}

export async function getStoreProfile(userId: string): Promise<StoreProfile | null> {
  await ensureSchema()
  const rows = await sql`
    select id, email, store_slug, store_name, store_published, stripe_account_id, connect_transfers_status
    from users where id = ${userId}::uuid
  `
  return rows[0] ? mapProfile(rows[0]) : null
}

export async function saveStoreProfile(input: {
  userId: string
  storeName: string
  storeSlug: string
  storePublished: boolean
}): Promise<StoreProfile> {
  await ensureSchema()
  try {
    const rows = await sql`
      update users
      set store_name = ${input.storeName},
          store_slug = ${input.storeSlug},
          store_published = ${input.storePublished}
      where id = ${input.userId}::uuid
      returning id, email, store_slug, store_name, store_published, stripe_account_id, connect_transfers_status
    `
    if (!rows[0]) throw new Error('Account not found')
    return mapProfile(rows[0])
  } catch (error) {
    if (uniqueViolation(error)) throw new Error('That store link is already taken.')
    throw error
  }
}

export async function setConnectAccount(userId: string, accountId: string, status: string): Promise<void> {
  await ensureSchema()
  await sql`
    update users
    set stripe_account_id = ${accountId}, connect_transfers_status = ${status}
    where id = ${userId}::uuid
  `
}

export async function userIdForConnectAccount(accountId: string): Promise<string | null> {
  await ensureSchema()
  const rows = await sql`select id from users where stripe_account_id = ${accountId}`
  return rows[0] ? String(rows[0].id) : null
}

export async function getSupplierProfileForUser(userId: string): Promise<SupplierProfile | null> {
  await ensureSchema()
  const rows = await sql`
    select sp.id, sp.user_id, sp.display_name, sp.slug, sp.notify_url, sp.status,
           u.stripe_account_id, u.connect_transfers_status
    from supplier_profiles sp
    join users u on u.id = sp.user_id
    where sp.user_id = ${userId}::uuid
  `
  const row = rows[0]
  if (!row) return null
  return {
    id: String(row.id),
    userId: String(row.user_id),
    displayName: String(row.display_name),
    slug: String(row.slug),
    notifyUrl: row.notify_url ? String(row.notify_url) : null,
    status: String(row.status),
    stripeAccountId: row.stripe_account_id ? String(row.stripe_account_id) : null,
    connectTransfersStatus: row.connect_transfers_status ? String(row.connect_transfers_status) : null,
  }
}

export async function createSupplierProfile(input: {
  userId: string
  displayName: string
  slug: string
  notifyUrl?: string | null
}): Promise<SupplierProfile> {
  await ensureSchema()
  try {
    await sql`
      insert into supplier_profiles (user_id, display_name, slug, notify_url)
      values (${input.userId}::uuid, ${input.displayName}, ${input.slug}, ${input.notifyUrl ?? null})
    `
  } catch (error) {
    if (uniqueViolation(error)) throw new Error('That supplier name is already taken, or this account is already a supplier.')
    throw error
  }
  const profile = await getSupplierProfileForUser(input.userId)
  if (!profile) throw new Error('Could not create supplier profile')
  return profile
}

export async function updateSupplierNotifyUrl(userId: string, notifyUrl: string | null): Promise<void> {
  await ensureSchema()
  await sql`update supplier_profiles set notify_url = ${notifyUrl} where user_id = ${userId}::uuid`
}

export interface UpsertProductInput {
  provider: SellableProvider
  externalId: string
  variantId: string
  supplierProfileId?: string | null
  title: string
  description?: string | null
  imageUrl?: string | null
  costCents: number
  shippingCents: number
  sku?: string | null
  stock?: number | null
  available: boolean
}

export async function upsertSupplierProduct(input: UpsertProductInput): Promise<string> {
  await ensureSchema()
  const rows = await sql`
    insert into supplier_products (
      provider, external_id, variant_id, supplier_profile_id, title, description, image_url,
      cost_cents, shipping_cents, sku, stock, available, updated_at
    ) values (
      ${input.provider}, ${input.externalId}, ${input.variantId}, ${input.supplierProfileId ?? null},
      ${input.title}, ${input.description ?? null}, ${input.imageUrl ?? null},
      ${input.costCents}, ${input.shippingCents}, ${input.sku ?? null}, ${input.stock ?? null},
      ${input.available}, now()
    )
    on conflict (provider, external_id, variant_id) do update set
      title = excluded.title,
      description = excluded.description,
      image_url = excluded.image_url,
      cost_cents = excluded.cost_cents,
      shipping_cents = excluded.shipping_cents,
      sku = excluded.sku,
      stock = excluded.stock,
      available = excluded.available,
      updated_at = now()
    returning id
  `
  return String(rows[0]?.id)
}

function mapProduct(row: Record<string, unknown>): SupplierProductRecord {
  const provider = String(row.provider)
  if (!isSellableProvider(provider)) throw new Error('Unknown supplier provider')
  return {
    id: String(row.id),
    provider,
    externalId: String(row.external_id),
    variantId: String(row.variant_id),
    supplierProfileId: row.supplier_profile_id ? String(row.supplier_profile_id) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    imageUrl: row.image_url ? String(row.image_url) : null,
    costCents: Number(row.cost_cents),
    shippingCents: Number(row.shipping_cents),
    sku: row.sku ? String(row.sku) : null,
    stock: row.stock === null || row.stock === undefined ? null : Number(row.stock),
    available: Boolean(row.available),
    supplierName: row.supplier_name ? String(row.supplier_name) : null,
  }
}

export async function listImportedProducts(provider?: SellableProvider): Promise<SupplierProductRecord[]> {
  await ensureSchema()
  const rows = provider
    ? await sql`
        select p.*, sp.display_name as supplier_name
        from supplier_products p
        left join supplier_profiles sp on sp.id = p.supplier_profile_id
        where p.provider = ${provider}
        order by p.updated_at desc
        limit 100
      `
    : await sql`
        select p.*, sp.display_name as supplier_name
        from supplier_products p
        left join supplier_profiles sp on sp.id = p.supplier_profile_id
        order by p.updated_at desc
        limit 100
      `
  return rows.map(mapProduct)
}

export async function listDirectCatalog(): Promise<SupplierProductRecord[]> {
  await ensureSchema()
  const rows = await sql`
    select p.*, sp.display_name as supplier_name
    from supplier_products p
    join supplier_profiles sp on sp.id = p.supplier_profile_id
    join users u on u.id = sp.user_id
    where p.provider = 'direct'
      and p.available = true
      and u.connect_transfers_status = 'active'
    order by p.updated_at desc
    limit 100
  `
  return rows.map(mapProduct)
}

export async function getSupplierProduct(id: string): Promise<SupplierProductRecord | null> {
  await ensureSchema()
  const rows = await sql`
    select p.*, sp.display_name as supplier_name
    from supplier_products p
    left join supplier_profiles sp on sp.id = p.supplier_profile_id
    where p.id = ${id}::uuid
  `
  return rows[0] ? mapProduct(rows[0]) : null
}

export async function listSellerListings(sellerUserId: string): Promise<ListingRecord[]> {
  await ensureSchema()
  const rows = await sql`
    ${listingSelect()}
    where l.seller_user_id = ${sellerUserId}::uuid
    order by l.created_at desc
  `
  return rows.map(mapListing)
}

export async function createListing(input: {
  sellerUserId: string
  supplierProductId: string
  title: string
  description: string | null
  priceCents: number
  slug: string
  published: boolean
}): Promise<string> {
  await ensureSchema()
  try {
    const rows = await sql`
      insert into store_listings (seller_user_id, supplier_product_id, title, description, price_cents, slug, published)
      values (
        ${input.sellerUserId}::uuid, ${input.supplierProductId}::uuid, ${input.title},
        ${input.description}, ${input.priceCents}, ${input.slug}, ${input.published}
      )
      returning id
    `
    return String(rows[0]?.id)
  } catch (error) {
    if (uniqueViolation(error)) throw new Error('That product is already in your store, or the link is taken.')
    throw error
  }
}

export async function updateListing(input: {
  sellerUserId: string
  listingId: string
  priceCents?: number
  title?: string
  published?: boolean
}): Promise<void> {
  await ensureSchema()
  const current = await sql`
    select id from store_listings where id = ${input.listingId}::uuid and seller_user_id = ${input.sellerUserId}::uuid
  `
  if (!current[0]) throw new Error('Listing not found')
  await sql`
    update store_listings set
      price_cents = coalesce(${input.priceCents ?? null}, price_cents),
      title = coalesce(${input.title ?? null}, title),
      published = coalesce(${input.published ?? null}, published)
    where id = ${input.listingId}::uuid
  `
}

export async function getPublishedStore(slug: string): Promise<PublicStore | null> {
  await ensureSchema()
  const stores = await sql`
    select id, store_slug, store_name, connect_transfers_status
    from users
    where store_slug = ${slug} and store_published = true
  `
  const store = stores[0]
  if (!store) return null
  const rows = await sql`
    ${listingSelect()}
    where l.seller_user_id = ${store.id} and l.published = true and p.available = true
    order by l.created_at desc
  `
  return {
    sellerUserId: String(store.id),
    storeSlug: String(store.store_slug),
    storeName: String(store.store_name || store.store_slug),
    payoutsReady: store.connect_transfers_status === 'active',
    listings: rows.map(mapListing),
  }
}

export async function getPublishedListing(slug: string, listingId: string): Promise<(ListingRecord & { storeName: string; storeSlug: string }) | null> {
  const store = await getPublishedStore(slug)
  const listing = store?.listings.find(item => item.id === listingId)
  if (!store || !listing) return null
  return { ...listing, storeName: store.storeName, storeSlug: store.storeSlug }
}

export interface OrderItemInput {
  listingId: string
  supplierProductId: string
  provider: SellableProvider
  supplierProfileId: string | null
  title: string
  quantity: number
  unitPriceCents: number
  unitCostCents: number
  unitShippingCents: number
  externalProductId: string
  externalVariantId: string
}

export async function createPendingOrder(input: {
  sellerUserId: string
  merchandiseCents: number
  shippingCents: number
  grossCents: number
  items: OrderItemInput[]
}): Promise<{ id: string; publicToken: string }> {
  await ensureSchema()
  const publicToken = randomUUID()
  return sql.begin(async transaction => {
    const orders = await transaction`
      insert into store_orders (
        seller_user_id, public_token, status, merchandise_cents, shipping_cents, gross_cents, sandbox
      ) values (
        ${input.sellerUserId}::uuid, ${publicToken}, 'pending_payment',
        ${input.merchandiseCents}, ${input.shippingCents}, ${input.grossCents},
        ${process.env.SUPPLIER_ORDERS_MODE === 'live' ? false : true}
      )
      returning id
    `
    const orderId = String(orders[0]?.id)
    for (const item of input.items) {
      await transaction`
        insert into store_order_items (
          order_id, listing_id, supplier_product_id, provider, supplier_profile_id, title, quantity,
          unit_price_cents, unit_cost_cents, unit_shipping_cents, external_product_id, external_variant_id
        ) values (
          ${orderId}::uuid, ${item.listingId}::uuid, ${item.supplierProductId}::uuid, ${item.provider},
          ${item.supplierProfileId}, ${item.title}, ${item.quantity}, ${item.unitPriceCents},
          ${item.unitCostCents}, ${item.unitShippingCents}, ${item.externalProductId}, ${item.externalVariantId}
        )
      `
    }
    return { id: orderId, publicToken }
  })
}

export async function attachCheckoutSession(orderId: string, sessionId: string): Promise<void> {
  await ensureSchema()
  await sql`
    update store_orders
    set stripe_checkout_session_id = ${sessionId}, updated_at = now()
    where id = ${orderId}::uuid
  `
}

export interface FulfillmentItem {
  id: string
  provider: SellableProvider
  supplierProfileId: string | null
  supplierAccountId: string | null
  title: string
  quantity: number
  unitPriceCents: number
  unitCostCents: number
  unitShippingCents: number
  externalProductId: string
  externalVariantId: string
  supplierProductId: string
}

export interface ClaimedOrder {
  id: string
  sellerUserId: string
  sellerAccountId: string | null
  merchandiseCents: number
  shippingCents: number
  grossCents: number
  items: FulfillmentItem[]
}

export async function claimOrder(orderId: string): Promise<ClaimedOrder | null> {
  await ensureSchema()
  return sql.begin(async transaction => {
    await transaction`select pg_advisory_xact_lock(hashtext(${`store-order:${orderId}`}))`
    const orders = await transaction`
      select o.*, u.stripe_account_id as seller_account_id
      from store_orders o
      join users u on u.id = o.seller_user_id
      where o.id = ${orderId}::uuid
    `
    const order = orders[0]
    if (!order) return null
    const claimed = await transaction`
      update store_orders
      set status = 'fulfilling', updated_at = now()
      where id = ${orderId}::uuid
        and (
          status in ('pending_payment', 'paid')
          or (status = 'fulfilling' and updated_at < now() - interval '2 minutes')
        )
      returning id
    `
    if (claimed.length === 0) return null
    const items = await transaction`
      select i.*, su.stripe_account_id as supplier_account_id
      from store_order_items i
      left join supplier_profiles sp on sp.id = i.supplier_profile_id
      left join users su on su.id = sp.user_id
      where i.order_id = ${orderId}::uuid
    `
    return {
      id: String(order.id),
      sellerUserId: String(order.seller_user_id),
      sellerAccountId: order.seller_account_id ? String(order.seller_account_id) : null,
      merchandiseCents: Number(order.merchandise_cents),
      shippingCents: Number(order.shipping_cents),
      grossCents: Number(order.gross_cents),
      items: items.map(item => {
        const provider = String(item.provider)
        if (!isSellableProvider(provider)) throw new Error('Order item has an unsellable provider')
        return {
          id: String(item.id),
          provider,
          supplierProfileId: item.supplier_profile_id ? String(item.supplier_profile_id) : null,
          supplierAccountId: item.supplier_account_id ? String(item.supplier_account_id) : null,
          title: String(item.title),
          quantity: Number(item.quantity),
          unitPriceCents: Number(item.unit_price_cents),
          unitCostCents: Number(item.unit_cost_cents),
          unitShippingCents: Number(item.unit_shipping_cents),
          externalProductId: String(item.external_product_id),
          externalVariantId: String(item.external_variant_id),
          supplierProductId: String(item.supplier_product_id),
        }
      }),
    }
  })
}

export async function markOrderPayment(input: {
  orderId: string
  paymentIntentId: string
  chargeId: string
  address: ShippingAddress
  grossCents: number
}): Promise<void> {
  await ensureSchema()
  await sql`
    update store_orders set
      stripe_payment_intent_id = ${input.paymentIntentId},
      stripe_charge_id = ${input.chargeId},
      customer_email = ${input.address.email},
      customer_name = ${input.address.name},
      shipping_address = ${sql.json(JSON.parse(JSON.stringify(input.address)))},
      gross_cents = ${input.grossCents},
      updated_at = now()
    where id = ${input.orderId}::uuid
  `
}

export async function saveFulfilledOrder(input: {
  orderId: string
  stripeFeeCents: number
  platformFeeCents: number
  supplierCostCents: number
  sellerTransferCents: number
  supplierTransferCents: number
  sandbox: boolean
  jobs: {
    groupKey: string
    provider: SellableProvider
    supplierProfileId: string | null
    externalOrderId: string
    sandbox: boolean
  }[]
  transfers: {
    role: 'seller' | 'supplier'
    groupKey: string | null
    stripeAccountId: string
    amountCents: number
    stripeTransferId: string
  }[]
}): Promise<void> {
  await ensureSchema()
  await sql.begin(async transaction => {
    await transaction`
      update store_orders set
        status = 'fulfilled',
        stripe_fee_cents = ${input.stripeFeeCents},
        platform_fee_cents = ${input.platformFeeCents},
        supplier_cost_cents = ${input.supplierCostCents},
        seller_transfer_cents = ${input.sellerTransferCents},
        supplier_transfer_cents = ${input.supplierTransferCents},
        sandbox = ${input.sandbox},
        failure_reason = null,
        updated_at = now()
      where id = ${input.orderId}::uuid
    `
    for (const job of input.jobs) {
      await transaction`
        insert into fulfillment_jobs (
          order_id, group_key, provider, supplier_profile_id, external_order_id, status, sandbox, updated_at
        ) values (
          ${input.orderId}::uuid, ${job.groupKey}, ${job.provider}, ${job.supplierProfileId},
          ${job.externalOrderId}, 'accepted', ${job.sandbox}, now()
        )
        on conflict (order_id, group_key) do update set
          external_order_id = excluded.external_order_id,
          status = 'accepted',
          sandbox = excluded.sandbox,
          error = null,
          updated_at = now()
      `
    }
    for (const transfer of input.transfers) {
      await transaction`
        insert into payout_transfers (
          order_id, role, group_key, stripe_account_id, amount_cents, stripe_transfer_id, status
        ) values (
          ${input.orderId}::uuid, ${transfer.role}, ${transfer.groupKey}, ${transfer.stripeAccountId},
          ${transfer.amountCents}, ${transfer.stripeTransferId}, 'paid'
        )
      `
    }
  })
}

export async function saveRefundedOrder(orderId: string, status: 'refunded' | 'supplier_rejected' | 'failed', reason: string): Promise<void> {
  await ensureSchema()
  await sql`
    update store_orders
    set status = ${status}, failure_reason = ${reason}, updated_at = now()
    where id = ${orderId}::uuid
  `
}

export async function addSupplierNotification(input: {
  supplierProfileId: string
  orderId: string
  message: string
}): Promise<void> {
  await ensureSchema()
  await sql`
    insert into supplier_notifications (supplier_profile_id, order_id, kind, message)
    values (${input.supplierProfileId}::uuid, ${input.orderId}::uuid, 'order', ${input.message})
  `
}

export async function getSupplierNotifyUrl(profileId: string): Promise<string | null> {
  await ensureSchema()
  const rows = await sql`select notify_url from supplier_profiles where id = ${profileId}::uuid`
  return rows[0]?.notify_url ? String(rows[0].notify_url) : null
}

export interface SellerOrderSummary {
  id: string
  publicToken: string
  status: string
  customerEmail: string | null
  grossCents: number
  sellerTransferCents: number | null
  supplierCostCents: number | null
  platformFeeCents: number | null
  stripeFeeCents: number | null
  failureReason: string | null
  createdAt: string
  trackingNumber: string | null
  trackingUrl: string | null
}

export async function listSellerOrders(sellerUserId: string): Promise<SellerOrderSummary[]> {
  await ensureSchema()
  const rows = await sql`
    select o.id, o.public_token, o.status, o.customer_email, o.gross_cents, o.seller_transfer_cents,
           o.supplier_cost_cents, o.platform_fee_cents, o.stripe_fee_cents, o.failure_reason, o.created_at,
           (select tracking_number from fulfillment_jobs j where j.order_id = o.id and j.tracking_number is not null limit 1) as tracking_number,
           (select tracking_url from fulfillment_jobs j where j.order_id = o.id and j.tracking_url is not null limit 1) as tracking_url
    from store_orders o
    where o.seller_user_id = ${sellerUserId}::uuid
    order by o.created_at desc
    limit 50
  `
  return rows.map(row => ({
    id: String(row.id),
    publicToken: String(row.public_token),
    status: String(row.status),
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    grossCents: Number(row.gross_cents),
    sellerTransferCents: row.seller_transfer_cents === null ? null : Number(row.seller_transfer_cents),
    supplierCostCents: row.supplier_cost_cents === null ? null : Number(row.supplier_cost_cents),
    platformFeeCents: row.platform_fee_cents === null ? null : Number(row.platform_fee_cents),
    stripeFeeCents: row.stripe_fee_cents === null ? null : Number(row.stripe_fee_cents),
    failureReason: row.failure_reason ? String(row.failure_reason) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    trackingUrl: row.tracking_url ? String(row.tracking_url) : null,
  }))
}

export interface PublicOrder {
  id: string
  storeSlug: string
  storeName: string
  status: string
  customerName: string | null
  grossCents: number
  failureReason: string | null
  items: { title: string; quantity: number; unitPriceCents: number }[]
  tracking: { number: string; url: string | null; carrier: string | null }[]
}

export async function getPublicOrder(token: string): Promise<PublicOrder | null> {
  await ensureSchema()
  const orders = await sql`
    select o.*, u.store_slug, u.store_name
    from store_orders o
    join users u on u.id = o.seller_user_id
    where o.public_token = ${token}
  `
  const order = orders[0]
  if (!order) return null
  const items = await sql`
    select title, quantity, unit_price_cents from store_order_items where order_id = ${order.id}
  `
  const jobs = await sql`
    select tracking_number, tracking_url, carrier
    from fulfillment_jobs
    where order_id = ${order.id} and tracking_number is not null
  `
  return {
    id: String(order.id),
    storeSlug: String(order.store_slug),
    storeName: String(order.store_name || order.store_slug),
    status: String(order.status),
    customerName: order.customer_name ? String(order.customer_name) : null,
    grossCents: Number(order.gross_cents),
    failureReason: order.failure_reason ? String(order.failure_reason) : null,
    items: items.map(item => ({
      title: String(item.title),
      quantity: Number(item.quantity),
      unitPriceCents: Number(item.unit_price_cents),
    })),
    tracking: jobs.map(job => ({
      number: String(job.tracking_number),
      url: job.tracking_url ? String(job.tracking_url) : null,
      carrier: job.carrier ? String(job.carrier) : null,
    })),
  }
}

export async function getOrderForSeller(sellerUserId: string, orderId: string) {
  await ensureSchema()
  const rows = await sql`
    select id, status, stripe_payment_intent_id
    from store_orders
    where id = ${orderId}::uuid and seller_user_id = ${sellerUserId}::uuid
  `
  const row = rows[0]
  if (!row) return null
  return {
    id: String(row.id),
    status: String(row.status),
    paymentIntentId: row.stripe_payment_intent_id ? String(row.stripe_payment_intent_id) : null,
  }
}

export async function orderIdForPaymentIntent(paymentIntentId: string): Promise<string | null> {
  await ensureSchema()
  const rows = await sql`select id from store_orders where stripe_payment_intent_id = ${paymentIntentId}`
  return rows[0] ? String(rows[0].id) : null
}

export interface OpenTransfer {
  stripeTransferId: string
  reversed: boolean
}

export async function listOrderTransfers(orderId: string): Promise<OpenTransfer[]> {
  await ensureSchema()
  const rows = await sql`
    select stripe_transfer_id, reversal_id from payout_transfers
    where order_id = ${orderId}::uuid and stripe_transfer_id is not null
  `
  return rows.map(row => ({
    stripeTransferId: String(row.stripe_transfer_id),
    reversed: Boolean(row.reversal_id),
  }))
}

export async function markTransferReversed(stripeTransferId: string, reversalId: string): Promise<void> {
  await ensureSchema()
  await sql`
    update payout_transfers
    set reversal_id = ${reversalId}, status = 'reversed'
    where stripe_transfer_id = ${stripeTransferId}
  `
}

export interface OpenFulfillment {
  provider: SellableProvider
  externalOrderId: string
  supplierProfileId: string | null
  groupKey: string
  items: FulfillmentItem[]
}

export async function takeOpenFulfillments(orderId: string): Promise<OpenFulfillment[]> {
  await ensureSchema()
  return sql.begin(async transaction => {
    const jobs = await transaction`
      update fulfillment_jobs
      set status = 'cancelled', updated_at = now()
      where order_id = ${orderId}::uuid and status <> 'cancelled'
      returning *
    `
    if (jobs.length === 0) return []
    const items = await transaction`
      select i.*, su.stripe_account_id as supplier_account_id
      from store_order_items i
      left join supplier_profiles sp on sp.id = i.supplier_profile_id
      left join users su on su.id = sp.user_id
      where i.order_id = ${orderId}::uuid
    `
    return jobs.flatMap(job => {
      const provider = String(job.provider)
      if (!isSellableProvider(provider)) return []
      const groupItems = items.filter(item => {
        if (provider === 'direct') return String(item.supplier_profile_id) === String(job.supplier_profile_id)
        return String(item.provider) === provider
      })
      return [{
        provider,
        externalOrderId: String(job.external_order_id),
        supplierProfileId: job.supplier_profile_id ? String(job.supplier_profile_id) : null,
        groupKey: String(job.group_key),
        items: groupItems.map(item => ({
          id: String(item.id),
          provider,
          supplierProfileId: item.supplier_profile_id ? String(item.supplier_profile_id) : null,
          supplierAccountId: item.supplier_account_id ? String(item.supplier_account_id) : null,
          title: String(item.title),
          quantity: Number(item.quantity),
          unitPriceCents: Number(item.unit_price_cents),
          unitCostCents: Number(item.unit_cost_cents),
          unitShippingCents: Number(item.unit_shipping_cents),
          externalProductId: String(item.external_product_id),
          externalVariantId: String(item.external_variant_id),
          supplierProductId: String(item.supplier_product_id),
        })),
      }]
    })
  })
}

export async function listJobsNeedingTracking(): Promise<{ id: string; provider: Exclude<SellableProvider, 'direct'>; externalOrderId: string }[]> {
  await ensureSchema()
  const rows = await sql`
    select id, provider, external_order_id
    from fulfillment_jobs
    where status = 'accepted'
      and tracking_number is null
      and external_order_id is not null
      and provider <> 'direct'
    order by updated_at asc
    limit 25
  `
  return rows.flatMap(row => {
    const provider = String(row.provider)
    if (provider !== 'cj' && provider !== 'printful' && provider !== 'printify') return []
    return [{ id: String(row.id), provider, externalOrderId: String(row.external_order_id) }]
  })
}

export async function saveTracking(jobId: string, tracking: { trackingNumber: string; trackingUrl?: string; carrier?: string }): Promise<void> {
  await ensureSchema()
  await sql`
    update fulfillment_jobs set
      tracking_number = ${tracking.trackingNumber},
      tracking_url = ${tracking.trackingUrl ?? null},
      carrier = ${tracking.carrier ?? null},
      status = 'shipped',
      updated_at = now()
    where id = ${jobId}::uuid
  `
}

export interface SupplierQueueOrder {
  jobId: string
  orderId: string
  status: string
  title: string
  quantity: number
  customerName: string | null
  address: ShippingAddress | null
  trackingNumber: string | null
  createdAt: string
}

export async function listSupplierQueue(userId: string): Promise<SupplierQueueOrder[]> {
  await ensureSchema()
  const rows = await sql`
    select j.id as job_id, j.status, j.tracking_number, o.id as order_id, o.customer_name,
           o.shipping_address, o.created_at, i.title, i.quantity
    from fulfillment_jobs j
    join supplier_profiles sp on sp.id = j.supplier_profile_id
    join store_orders o on o.id = j.order_id
    join store_order_items i on i.order_id = o.id and i.supplier_profile_id = sp.id
    where sp.user_id = ${userId}::uuid
    order by o.created_at desc
    limit 50
  `
  return rows.map(row => ({
    jobId: String(row.job_id),
    orderId: String(row.order_id),
    status: String(row.status),
    title: String(row.title),
    quantity: Number(row.quantity),
    customerName: row.customer_name ? String(row.customer_name) : null,
    address: (row.shipping_address as ShippingAddress | null) ?? null,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }))
}

export async function saveDirectTracking(input: {
  userId: string
  jobId: string
  trackingNumber: string
  trackingUrl?: string
  carrier?: string
}): Promise<boolean> {
  await ensureSchema()
  const rows = await sql`
    update fulfillment_jobs j
    set tracking_number = ${input.trackingNumber},
        tracking_url = ${input.trackingUrl ?? null},
        carrier = ${input.carrier ?? null},
        status = 'shipped',
        updated_at = now()
    from supplier_profiles sp
    where j.id = ${input.jobId}::uuid
      and j.supplier_profile_id = sp.id
      and sp.user_id = ${input.userId}::uuid
    returning j.id
  `
  return rows.length > 0
}

export async function countListings(sellerUserId: string): Promise<number> {
  await ensureSchema()
  const rows = await sql`select count(*)::int as count from store_listings where seller_user_id = ${sellerUserId}::uuid`
  return Number(rows[0]?.count ?? 0)
}
