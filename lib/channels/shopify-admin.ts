import { shopifyApiVersion, shopifyErrorMessage } from '@/lib/shopify'
import { countryName } from '@/lib/commerce/country'
import { dollarsToCents } from '@/lib/commerce/money'
import type { ShippingAddress } from '@/lib/commerce/types'
import type { IncomingChannelLine } from './map-order'

export interface ShopifyListingPush {
  id: string
  title: string
  description: string | null
  priceCents: number
  imageUrl: string | null
  shopifyProductId: string | null
  shopifyVariantId: string | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function shopifyListingBody(listing: ShopifyListingPush): Record<string, unknown> {
  const price = (listing.priceCents / 100).toFixed(2)
  const variant: Record<string, unknown> = {
    price,
    sku: `ds-${listing.id}`,
    requires_shipping: true,
  }
  if (listing.shopifyVariantId) variant.id = Number(listing.shopifyVariantId)
  const product: Record<string, unknown> = {
    title: listing.title,
    body_html: `<p>${escapeHtml(listing.description?.trim() || 'Fulfilled by the connected supplier.')}</p>`,
    vendor: 'Dropship Scout',
    status: 'active',
    tags: 'dropship-scout',
    variants: [variant],
  }
  if (listing.shopifyProductId) product.id = Number(listing.shopifyProductId)
  else if (listing.imageUrl) product.images = [{ src: listing.imageUrl, alt: listing.title }]
  return { product }
}

async function shopifyAdmin(
  domain: string,
  token: string,
  path: string,
  init?: { method?: string; body?: string }
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await fetch(`https://${domain}/admin/api/${shopifyApiVersion()}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      'X-Shopify-Access-Token': token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: init?.body,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const body = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, body }
}

export async function pushListingToShopify(
  domain: string,
  token: string,
  listing: ShopifyListingPush
): Promise<{ ok: true; productId: string; variantId: string } | { ok: false; error: string }> {
  const path = listing.shopifyProductId
    ? `/products/${listing.shopifyProductId}.json`
    : '/products.json'
  const response = await shopifyAdmin(domain, token, path, {
    method: listing.shopifyProductId ? 'PUT' : 'POST',
    body: JSON.stringify(shopifyListingBody(listing)),
  })
  const product = asRecord(asRecord(response.body)?.product)
  const variant = Array.isArray(product?.variants) ? asRecord(product.variants[0]) : null
  if (!response.ok || !product?.id || !variant?.id) {
    return { ok: false, error: shopifyErrorMessage(response.body, response.status) }
  }
  return { ok: true, productId: String(product.id), variantId: String(variant.id) }
}

export interface ShopifyOrderDraft {
  externalOrderId: string
  currency: string
  email: string
  shippingCents: number
  address: ShippingAddress | null
  lines: IncomingChannelLine[]
  refundLineItems: { id: number; quantity: number }[]
}

export function parseShopifyOrder(body: unknown): ShopifyOrderDraft | { error: string } {
  const order = asRecord(body)
  if (!order?.id) return { error: 'Shopify order is missing an id.' }
  const currency = text(order.currency) || 'USD'
  const email = text(order.email) || text(asRecord(order.customer)?.email) || ''
  const shippingLines = Array.isArray(order.shipping_lines) ? order.shipping_lines : []
  const shippingCents = shippingLines.reduce<number>((sum, line) => {
    const amount = dollarsToCents(asRecord(line)?.price) ?? 0
    return sum + amount
  }, 0)
  const rawLines = Array.isArray(order.line_items) ? order.line_items : []
  const lines: IncomingChannelLine[] = []
  const refundLineItems: { id: number; quantity: number }[] = []
  for (const raw of rawLines) {
    const line = asRecord(raw)
    if (!line) continue
    const quantity = Number(line.quantity)
    const unitPriceCents = dollarsToCents(line.price)
    lines.push({
      channelLineId: String(line.id ?? ''),
      matchKey: String(line.variant_id ?? ''),
      quantity,
      unitPriceCents: unitPriceCents ?? -1,
      title: text(line.title) || 'Item',
    })
    if (typeof line.id === 'number' && Number.isInteger(quantity)) {
      refundLineItems.push({ id: line.id, quantity })
    }
  }
  return {
    externalOrderId: String(order.id),
    currency,
    email,
    shippingCents,
    address: shopifyAddress(order, email),
    lines,
    refundLineItems,
  }
}

export async function listPaidShopifyOrders(
  domain: string,
  token: string
): Promise<{ ok: true; orders: unknown[] } | { ok: false; error: string }> {
  const response = await shopifyAdmin(
    domain,
    token,
    '/orders.json?status=open&financial_status=paid&fulfillment_status=unfulfilled&limit=50'
  )
  if (!response.ok) return { ok: false, error: shopifyErrorMessage(response.body, response.status) }
  const orders = asRecord(response.body)?.orders
  return { ok: true, orders: Array.isArray(orders) ? orders : [] }
}

export function shopifyRefundBody(lineItems: { id: number; quantity: number }[]): Record<string, unknown> {
  return {
    refund: {
      note: 'The supplier could not fulfill this order.',
      notify: true,
      refund_line_items: lineItems.map(line => ({
        line_item_id: line.id,
        quantity: line.quantity,
        restock_type: 'no_restock',
      })),
    },
  }
}

export async function refundFullShopifyOrder(domain: string, token: string, orderId: string): Promise<void> {
  const response = await shopifyAdmin(domain, token, `/orders/${orderId}.json`)
  if (!response.ok) throw new Error(shopifyErrorMessage(response.body, response.status))
  const parsed = parseShopifyOrder(asRecord(response.body)?.order)
  if ('error' in parsed) throw new Error(parsed.error)
  await refundShopifyOrder(domain, token, orderId, parsed.refundLineItems)
}

export async function refundShopifyOrder(
  domain: string,
  token: string,
  orderId: string,
  lineItems: { id: number; quantity: number }[]
): Promise<void> {
  const response = await shopifyAdmin(domain, token, `/orders/${orderId}/refunds.json`, {
    method: 'POST',
    body: JSON.stringify(shopifyRefundBody(lineItems)),
  })
  if (!response.ok) {
    throw new Error(shopifyErrorMessage(response.body, response.status))
  }
}

function shopifyAddress(order: Record<string, unknown>, email: string): ShippingAddress | null {
  const shipping = asRecord(order.shipping_address)
  if (!shipping) return null
  const countryCode = text(shipping.country_code) || ''
  const first = text(shipping.first_name)
  const last = text(shipping.last_name)
  return {
    name: text(shipping.name) || [first, last].filter(Boolean).join(' ') || 'Customer',
    email,
    phone: text(shipping.phone) || undefined,
    address1: text(shipping.address1) || '',
    address2: text(shipping.address2) || undefined,
    city: text(shipping.city) || '',
    province: text(shipping.province_code) || text(shipping.province) || '',
    countryCode,
    country: countryName(countryCode),
    zip: text(shipping.zip) || '',
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
