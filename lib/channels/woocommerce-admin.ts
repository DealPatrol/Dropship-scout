import { countryName } from '@/lib/commerce/country'
import { dollarsToCents } from '@/lib/commerce/money'
import type { ShippingAddress } from '@/lib/commerce/types'
import type { IncomingChannelLine } from './map-order'

export interface WooListingPush {
  id: string
  title: string
  description: string | null
  priceCents: number
  imageUrl: string | null
  woocommerceProductId: string | null
}

export function normalizeWooUrl(value: string): string | null {
  const trimmed = value.trim().replace(/\/$/, '')
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null
  return url.origin
}

function wooAuth(key: string, secret: string): string {
  return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`
}

async function wooAdmin(
  siteUrl: string,
  key: string,
  secret: string,
  path: string,
  init?: { method?: string; body?: string }
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await fetch(`${siteUrl}/wp-json/wc/v3${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: wooAuth(key, secret),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: init?.body,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
    redirect: 'error',
  })
  const body = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, body }
}

export async function validateWooConnection(
  siteUrl: string,
  key: string,
  secret: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await wooAdmin(siteUrl, key, secret, '/products?per_page=1')
  if (response.status === 401 || response.status === 403) {
    return { ok: false, error: 'WooCommerce rejected the API key. It needs read and write access to products and orders.' }
  }
  if (!response.ok) {
    return { ok: false, error: `WooCommerce connection failed with HTTP ${response.status}.` }
  }
  return { ok: true }
}

export function wooListingBody(listing: WooListingPush): Record<string, unknown> {
  return {
    name: listing.title,
    type: 'simple',
    regular_price: (listing.priceCents / 100).toFixed(2),
    description: listing.description?.trim() || 'Fulfilled by the connected supplier.',
    sku: `ds-${listing.id}`,
    status: 'publish',
    ...(listing.imageUrl ? { images: [{ src: listing.imageUrl, alt: listing.title }] } : {}),
  }
}

export async function pushListingToWoo(
  siteUrl: string,
  key: string,
  secret: string,
  listing: WooListingPush
): Promise<{ ok: true; productId: string } | { ok: false; error: string }> {
  const path = listing.woocommerceProductId
    ? `/products/${listing.woocommerceProductId}`
    : '/products'
  const response = await wooAdmin(siteUrl, key, secret, path, {
    method: listing.woocommerceProductId ? 'PUT' : 'POST',
    body: JSON.stringify(wooListingBody(listing)),
  })
  const product = asRecord(response.body)
  if (!response.ok || !product?.id) {
    return { ok: false, error: wooError(response.body, response.status) }
  }
  return { ok: true, productId: String(product.id) }
}

export interface WooOrderDraft {
  externalOrderId: string
  currency: string
  email: string
  shippingCents: number
  grossCents: number | null
  address: ShippingAddress | null
  lines: IncomingChannelLine[]
}

export function parseWooOrder(body: unknown): WooOrderDraft | { error: string } {
  const order = asRecord(body)
  if (!order?.id) return { error: 'WooCommerce order is missing an id.' }
  const billing = asRecord(order.billing)
  const shipping = asRecord(order.shipping) ?? billing
  const email = text(billing?.email) || ''
  const countryCode = text(shipping?.country) || ''
  const rawLines = Array.isArray(order.line_items) ? order.line_items : []
  const lines: IncomingChannelLine[] = rawLines.flatMap(raw => {
    const line = asRecord(raw)
    if (!line) return []
    const quantity = Number(line.quantity)
    const total = dollarsToCents(line.total)
    const unitPriceCents = total === null || !Number.isInteger(quantity) || quantity < 1
      ? -1
      : Math.round(total / quantity)
    return [{
      channelLineId: String(line.id ?? ''),
      matchKey: String(line.product_id ?? ''),
      quantity,
      unitPriceCents,
      title: text(line.name) || 'Item',
    }]
  })
  return {
    externalOrderId: String(order.id),
    currency: text(order.currency) || 'USD',
    email,
    shippingCents: dollarsToCents(order.shipping_total) ?? 0,
    grossCents: dollarsToCents(order.total),
    address: shipping ? {
      name: [text(shipping.first_name), text(shipping.last_name)].filter(Boolean).join(' ') || 'Customer',
      email,
      phone: text(billing?.phone) || undefined,
      address1: text(shipping.address_1) || '',
      address2: text(shipping.address_2) || undefined,
      city: text(shipping.city) || '',
      province: text(shipping.state) || '',
      countryCode,
      country: countryName(countryCode),
      zip: text(shipping.postcode) || '',
    } : null,
    lines,
  }
}

export async function listProcessingWooOrders(
  siteUrl: string,
  key: string,
  secret: string
): Promise<{ ok: true; orders: unknown[] } | { ok: false; error: string }> {
  const response = await wooAdmin(siteUrl, key, secret, '/orders?status=processing&per_page=20')
  if (!response.ok) return { ok: false, error: wooError(response.body, response.status) }
  return { ok: true, orders: Array.isArray(response.body) ? response.body : [] }
}

export async function refundFullWooOrder(
  siteUrl: string,
  key: string,
  secret: string,
  orderId: string
): Promise<void> {
  const response = await wooAdmin(siteUrl, key, secret, `/orders/${orderId}`)
  if (!response.ok) throw new Error(wooError(response.body, response.status))
  const amount = dollarsToCents(asRecord(response.body)?.total)
  if (amount === null || amount <= 0) throw new Error('WooCommerce order total is missing.')
  await refundWooOrder(siteUrl, key, secret, orderId, amount)
}

export async function refundWooOrder(
  siteUrl: string,
  key: string,
  secret: string,
  orderId: string,
  amountCents: number
): Promise<void> {
  const response = await wooAdmin(siteUrl, key, secret, `/orders/${orderId}/refunds`, {
    method: 'POST',
    body: JSON.stringify({
      amount: (amountCents / 100).toFixed(2),
      reason: 'The supplier could not fulfill this order.',
      api_refund: true,
    }),
  })
  if (!response.ok) throw new Error(wooError(response.body, response.status))
}

function wooError(body: unknown, status: number): string {
  const record = asRecord(body)
  if (typeof record?.message === 'string') return record.message
  return `WooCommerce returned HTTP ${status}`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
