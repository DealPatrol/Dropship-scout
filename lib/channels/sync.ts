import { platformFeeBps, supplierOrdersMode } from '@/lib/commerce/modes'
import { fulfillExternalOrder } from '@/lib/commerce/process-order'
import { getShopifyCredentials } from '@/lib/db'
import { listSellerListings } from '@/lib/store-db'
import {
  getWooCredentials,
  insertChannelOrder,
  listChannelConnections,
  saveListingShopifyIds,
  saveListingWooId,
} from '@/lib/channel-db'
import { mapChannelOrder, type ChannelListingMatch } from './map-order'
import {
  listPaidShopifyOrders,
  parseShopifyOrder,
  pushListingToShopify,
  refundShopifyOrder,
} from './shopify-admin'
import {
  listProcessingWooOrders,
  parseWooOrder,
  pushListingToWoo,
  refundWooOrder,
} from './woocommerce-admin'

export function channelOrderPauseReason(): string | null {
  if (supplierOrdersMode() === 'live') {
    return 'Channel order import is paused while SUPPLIER_ORDERS_MODE=live. Hosted checkout can still place live supplier orders because Dropship Scout collected that payment. Channel customers paid the external store, so this app will not bill a supplier for those orders.'
  }
  return null
}

export async function syncShopifyListings(userId: string): Promise<{ synced: number; errors: string[] }> {
  const credentials = await getShopifyCredentials(userId)
  if (!credentials) return { synced: 0, errors: ['Connect Shopify before syncing products.'] }
  const listings = (await listSellerListings(userId)).filter(listing => listing.published && listing.available)
  const errors: string[] = []
  let synced = 0
  for (const listing of listings) {
    const result = await pushListingToShopify(credentials.domain, credentials.token, listing)
    if (!result.ok) {
      errors.push(`${listing.title}: ${result.error}`)
      continue
    }
    await saveListingShopifyIds(listing.id, result.productId, result.variantId)
    synced += 1
  }
  return { synced, errors }
}

export async function syncWooListings(userId: string): Promise<{ synced: number; errors: string[] }> {
  const credentials = await getWooCredentials(userId)
  if (!credentials) return { synced: 0, errors: ['Connect WooCommerce before syncing products.'] }
  const listings = (await listSellerListings(userId)).filter(listing => listing.published && listing.available)
  const errors: string[] = []
  let synced = 0
  for (const listing of listings) {
    const result = await pushListingToWoo(credentials.url, credentials.key, credentials.secret, listing)
    if (!result.ok) {
      errors.push(`${listing.title}: ${result.error}`)
      continue
    }
    await saveListingWooId(listing.id, result.productId)
    synced += 1
  }
  return { synced, errors }
}

export interface PullResult {
  imported: number
  skipped: { externalOrderId: string; reason: string }[]
  errors: string[]
}

export async function pullShopifyOrders(userId: string): Promise<PullResult> {
  const paused = channelOrderPauseReason()
  if (paused) return { imported: 0, skipped: [], errors: [paused] }
  const credentials = await getShopifyCredentials(userId)
  if (!credentials) return { imported: 0, skipped: [], errors: ['Connect Shopify before pulling orders.'] }
  const remote = await listPaidShopifyOrders(credentials.domain, credentials.token)
  if (!remote.ok) return { imported: 0, skipped: [], errors: [remote.error] }
  const listings = shopifyMatches(await listSellerListings(userId))
  const result: PullResult = { imported: 0, skipped: [], errors: [] }
  for (const raw of remote.orders) {
    const parsed = parseShopifyOrder(raw)
    if ('error' in parsed) {
      result.errors.push(parsed.error)
      continue
    }
    const mapped = mapChannelOrder({
      externalOrderId: parsed.externalOrderId,
      currency: parsed.currency,
      email: parsed.email,
      shippingCents: parsed.shippingCents,
      address: parsed.address,
      lines: parsed.lines,
      listings,
      platformFeeBps: platformFeeBps(),
    })
    if (!mapped.ok) {
      result.skipped.push({ externalOrderId: parsed.externalOrderId, reason: mapped.reason })
      continue
    }
    const created = await insertChannelOrder({
      sellerUserId: userId,
      channel: 'shopify',
      externalOrderId: mapped.order.externalOrderId,
      merchandiseCents: mapped.order.merchandiseCents,
      shippingCents: mapped.order.shippingCents,
      grossCents: mapped.order.grossCents,
      items: mapped.order.lines.map(line => ({
        listingId: line.listing.id,
        supplierProductId: line.listing.supplierProductId,
        provider: line.listing.provider,
        supplierProfileId: line.listing.supplierProfileId,
        title: line.title,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        unitCostCents: line.listing.costCents,
        unitShippingCents: line.listing.shippingCents,
        externalProductId: line.listing.externalProductId,
        externalVariantId: line.listing.externalVariantId,
      })),
    })
    if ('duplicate' in created) {
      result.skipped.push({ externalOrderId: parsed.externalOrderId, reason: 'Already imported.' })
      continue
    }
    const fulfilled = await fulfillExternalOrder({
      orderId: created.id,
      externalPaymentId: `shopify:${parsed.externalOrderId}`,
      grossCents: mapped.order.grossCents,
      feeCents: mapped.order.feeCents,
      address: mapped.order.address,
      refund: () => refundShopifyOrder(
        credentials.domain,
        credentials.token,
        parsed.externalOrderId,
        parsed.refundLineItems
      ),
    })
    if (fulfilled.status === 'fulfilled') result.imported += 1
    else result.errors.push(`${parsed.externalOrderId}: ${fulfilled.reason || fulfilled.status}`)
  }
  return result
}

export async function pullWooOrders(userId: string): Promise<PullResult> {
  const paused = channelOrderPauseReason()
  if (paused) return { imported: 0, skipped: [], errors: [paused] }
  const credentials = await getWooCredentials(userId)
  if (!credentials) return { imported: 0, skipped: [], errors: ['Connect WooCommerce before pulling orders.'] }
  const remote = await listProcessingWooOrders(credentials.url, credentials.key, credentials.secret)
  if (!remote.ok) return { imported: 0, skipped: [], errors: [remote.error] }
  const listings = wooMatches(await listSellerListings(userId))
  const result: PullResult = { imported: 0, skipped: [], errors: [] }
  for (const raw of remote.orders) {
    const parsed = parseWooOrder(raw)
    if ('error' in parsed) {
      result.errors.push(parsed.error)
      continue
    }
    const mapped = mapChannelOrder({
      externalOrderId: parsed.externalOrderId,
      currency: parsed.currency,
      email: parsed.email,
      shippingCents: parsed.shippingCents,
      address: parsed.address,
      lines: parsed.lines,
      listings,
      platformFeeBps: platformFeeBps(),
    })
    if (!mapped.ok) {
      result.skipped.push({ externalOrderId: parsed.externalOrderId, reason: mapped.reason })
      continue
    }
    const created = await insertChannelOrder({
      sellerUserId: userId,
      channel: 'woocommerce',
      externalOrderId: mapped.order.externalOrderId,
      merchandiseCents: mapped.order.merchandiseCents,
      shippingCents: mapped.order.shippingCents,
      grossCents: mapped.order.grossCents,
      items: mapped.order.lines.map(line => ({
        listingId: line.listing.id,
        supplierProductId: line.listing.supplierProductId,
        provider: line.listing.provider,
        supplierProfileId: line.listing.supplierProfileId,
        title: line.title,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        unitCostCents: line.listing.costCents,
        unitShippingCents: line.listing.shippingCents,
        externalProductId: line.listing.externalProductId,
        externalVariantId: line.listing.externalVariantId,
      })),
    })
    if ('duplicate' in created) {
      result.skipped.push({ externalOrderId: parsed.externalOrderId, reason: 'Already imported.' })
      continue
    }
    const fulfilled = await fulfillExternalOrder({
      orderId: created.id,
      externalPaymentId: `woocommerce:${parsed.externalOrderId}`,
      grossCents: mapped.order.grossCents,
      feeCents: mapped.order.feeCents,
      address: mapped.order.address,
      refund: () => refundWooOrder(
        credentials.url,
        credentials.key,
        credentials.secret,
        parsed.externalOrderId,
        mapped.order.grossCents
      ),
    })
    if (fulfilled.status === 'fulfilled') result.imported += 1
    else result.errors.push(`${parsed.externalOrderId}: ${fulfilled.reason || fulfilled.status}`)
  }
  return result
}

export async function pullConnectedChannelOrders(): Promise<{ shops: number; imported: number }> {
  if (channelOrderPauseReason()) return { shops: 0, imported: 0 }
  const connections = await listChannelConnections()
  let imported = 0
  for (const connection of connections) {
    if (connection.shopify) {
      const result = await pullShopifyOrders(connection.userId).catch(error => ({
        imported: 0,
        skipped: [],
        errors: [error instanceof Error ? error.message : 'Shopify pull failed'],
      }))
      imported += result.imported
    }
    if (connection.woocommerce) {
      const result = await pullWooOrders(connection.userId).catch(error => ({
        imported: 0,
        skipped: [],
        errors: [error instanceof Error ? error.message : 'WooCommerce pull failed'],
      }))
      imported += result.imported
    }
  }
  return { shops: connections.length, imported }
}

function shopifyMatches(listings: Awaited<ReturnType<typeof listSellerListings>>): ChannelListingMatch[] {
  return listings.flatMap(listing => {
    if (!listing.published || !listing.shopifyVariantId) return []
    return [toMatch(listing, listing.shopifyVariantId)]
  })
}

function wooMatches(listings: Awaited<ReturnType<typeof listSellerListings>>): ChannelListingMatch[] {
  return listings.flatMap(listing => {
    if (!listing.published || !listing.woocommerceProductId) return []
    return [toMatch(listing, listing.woocommerceProductId)]
  })
}

function toMatch(listing: Awaited<ReturnType<typeof listSellerListings>>[number], matchKey: string): ChannelListingMatch {
  return {
    id: listing.id,
    title: listing.title,
    supplierProductId: listing.supplierProductId,
    provider: listing.provider,
    supplierProfileId: listing.supplierProfileId,
    supplierAccountId: listing.supplierAccountId,
    costCents: listing.costCents,
    shippingCents: listing.shippingCents,
    externalProductId: listing.externalProductId,
    externalVariantId: listing.externalVariantId,
    matchKey,
  }
}
