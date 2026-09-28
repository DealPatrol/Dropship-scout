import { randomUUID } from 'crypto'
import { ensureSchema, sql } from '@/lib/database'
import { decryptSecret, encryptSecret } from '@/lib/secrets'
import type { SellableProvider } from '@/lib/commerce/types'

export async function saveListingShopifyIds(listingId: string, productId: string, variantId: string): Promise<void> {
  await ensureSchema()
  await sql`
    update store_listings
    set shopify_product_id = ${productId}, shopify_variant_id = ${variantId}
    where id = ${listingId}::uuid
  `
}

export async function saveListingWooId(listingId: string, productId: string): Promise<void> {
  await ensureSchema()
  await sql`
    update store_listings
    set woocommerce_product_id = ${productId}
    where id = ${listingId}::uuid
  `
}

export interface WooCredentials {
  url: string
  key: string
  secret: string
}

export async function saveWooCredentials(userId: string, url: string, key: string, secret: string): Promise<void> {
  await ensureSchema()
  await sql`
    update users
    set woocommerce_url = ${url},
        woocommerce_key_enc = ${encryptSecret(key)},
        woocommerce_secret_enc = ${encryptSecret(secret)}
    where id = ${userId}::uuid
  `
}

export async function clearWooCredentials(userId: string): Promise<void> {
  await ensureSchema()
  await sql`
    update users
    set woocommerce_url = null, woocommerce_key_enc = null, woocommerce_secret_enc = null
    where id = ${userId}::uuid
  `
}

export async function getWooCredentials(userId: string): Promise<WooCredentials | null> {
  await ensureSchema()
  const rows = await sql`
    select woocommerce_url, woocommerce_key_enc, woocommerce_secret_enc
    from users where id = ${userId}::uuid
  `
  const row = rows[0]
  if (!row?.woocommerce_url || !row.woocommerce_key_enc || !row.woocommerce_secret_enc) return null
  return {
    url: String(row.woocommerce_url),
    key: decryptSecret(String(row.woocommerce_key_enc)),
    secret: decryptSecret(String(row.woocommerce_secret_enc)),
  }
}

export async function getWooUrl(userId: string): Promise<string | null> {
  await ensureSchema()
  const rows = await sql`select woocommerce_url from users where id = ${userId}::uuid`
  return rows[0]?.woocommerce_url ? String(rows[0].woocommerce_url) : null
}

export interface ChannelConnectionRow {
  userId: string
  shopify: boolean
  woocommerce: boolean
}

export async function listChannelConnections(): Promise<ChannelConnectionRow[]> {
  await ensureSchema()
  const rows = await sql`
    select id,
           (shopify_domain is not null and shopify_token_enc is not null) as shopify,
           (woocommerce_url is not null and woocommerce_key_enc is not null) as woocommerce
    from users
    where (shopify_domain is not null and shopify_token_enc is not null)
       or (woocommerce_url is not null and woocommerce_key_enc is not null)
  `
  return rows.map(row => ({
    userId: String(row.id),
    shopify: Boolean(row.shopify),
    woocommerce: Boolean(row.woocommerce),
  }))
}

export interface ChannelOrderItem {
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

export async function insertChannelOrder(input: {
  sellerUserId: string
  channel: 'shopify' | 'woocommerce'
  externalOrderId: string
  merchandiseCents: number
  shippingCents: number
  grossCents: number
  items: ChannelOrderItem[]
}): Promise<{ id: string } | { duplicate: true }> {
  await ensureSchema()
  const publicToken = randomUUID()
  try {
    return await sql.begin(async transaction => {
      const orders = await transaction`
        insert into store_orders (
          seller_user_id, public_token, status, merchandise_cents, shipping_cents, gross_cents,
          sandbox, channel, external_order_id, payout_mode
        ) values (
          ${input.sellerUserId}::uuid, ${publicToken}, 'pending_payment',
          ${input.merchandiseCents}, ${input.shippingCents}, ${input.grossCents},
          true, ${input.channel}, ${input.externalOrderId}, 'channel_collected'
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
      return { id: orderId }
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505') {
      return { duplicate: true }
    }
    throw error
  }
}
