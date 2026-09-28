import { describe, expect, it } from 'vitest'
import { SALES_CHANNELS } from '@/lib/channels/directory'
import { mapChannelOrder } from '@/lib/channels/map-order'
import { parseShopifyOrder, shopifyListingBody, shopifyRefundBody } from '@/lib/channels/shopify-admin'
import { normalizeWooUrl, parseWooOrder, wooListingBody } from '@/lib/channels/woocommerce-admin'
import type { ChannelListingMatch } from '@/lib/channels/map-order'
import type { ShippingAddress } from '@/lib/commerce/types'

const address: ShippingAddress = {
  name: 'Ada Buyer',
  email: 'ada@example.com',
  address1: '1 Market St',
  city: 'San Francisco',
  province: 'CA',
  countryCode: 'US',
  country: 'United States',
  zip: '94105',
}

const listing: ChannelListingMatch = {
  id: 'listing-1',
  title: 'Canvas tote',
  supplierProductId: 'product-1',
  provider: 'cj',
  supplierProfileId: null,
  supplierAccountId: null,
  costCents: 1200,
  shippingCents: 400,
  externalProductId: 'cj-1',
  externalVariantId: 'var-1',
  matchKey: '55',
}

describe('sales channels', () => {
  it('marks only implemented APIs as live', () => {
    const live = SALES_CHANNELS.filter(channel => channel.status === 'live').map(channel => channel.id)
    const waiting = SALES_CHANNELS.filter(channel => channel.status === 'coming_soon').map(channel => channel.id)
    expect(live).toEqual(['hosted', 'shopify', 'woocommerce'])
    expect(waiting).toEqual(['etsy', 'ebay', 'tiktok'])
  })

  it('maps a paid Shopify order onto a published listing', () => {
    const parsed = parseShopifyOrder({
      id: 99,
      currency: 'USD',
      email: 'ada@example.com',
      shipping_lines: [{ price: '4.00' }],
      shipping_address: {
        name: 'Ada Buyer',
        address1: '1 Market St',
        city: 'San Francisco',
        province_code: 'CA',
        country_code: 'US',
        zip: '94105',
      },
      line_items: [{ id: 7, variant_id: 55, quantity: 1, price: '32.00', title: 'Canvas tote' }],
    })
    expect('error' in parsed).toBe(false)
    if ('error' in parsed) return
    const mapped = mapChannelOrder({
      externalOrderId: parsed.externalOrderId,
      currency: parsed.currency,
      email: parsed.email,
      shippingCents: parsed.shippingCents,
      address: parsed.address,
      lines: parsed.lines,
      listings: [listing],
      platformFeeBps: 500,
    })
    expect(mapped.ok).toBe(true)
    if (!mapped.ok) return
    expect(mapped.order.grossCents).toBe(3600)
    expect(shopifyRefundBody(parsed.refundLineItems).refund).toMatchObject({
      refund_line_items: [{ line_item_id: 7, quantity: 1 }],
    })
  })

  it('skips a channel line that was not published from this catalog', () => {
    const mapped = mapChannelOrder({
      externalOrderId: '1',
      currency: 'USD',
      email: 'ada@example.com',
      shippingCents: 0,
      address,
      lines: [{ channelLineId: '1', matchKey: 'missing', quantity: 1, unitPriceCents: 3200, title: 'Other' }],
      listings: [listing],
      platformFeeBps: 500,
    })
    expect(mapped.ok).toBe(false)
  })

  it('builds a Shopify product from a listing and rejects insecure WooCommerce URLs', () => {
    const body = shopifyListingBody({
      id: 'listing-1',
      title: 'Canvas tote',
      description: 'A <bag>',
      priceCents: 3200,
      imageUrl: null,
      shopifyProductId: null,
      shopifyVariantId: null,
    })
    expect(body.product).toMatchObject({ title: 'Canvas tote', variants: [{ price: '32.00', sku: 'ds-listing-1' }] })
    expect(JSON.stringify(body)).toContain('A &lt;bag&gt;')
    expect(normalizeWooUrl('https://shop.example.com/')).toBe('https://shop.example.com')
    expect(normalizeWooUrl('http://shop.example.com')).toBeNull()
    const woo = wooListingBody({
      id: 'listing-1',
      title: 'Canvas tote',
      description: null,
      priceCents: 3200,
      imageUrl: null,
      woocommerceProductId: null,
    })
    expect(woo.regular_price).toBe('32.00')
    const order = parseWooOrder({
      id: 4,
      currency: 'USD',
      shipping_total: '4.00',
      total: '36.00',
      billing: { email: 'ada@example.com', phone: '555' },
      shipping: { first_name: 'Ada', last_name: 'Buyer', address_1: '1 Market St', city: 'San Francisco', state: 'CA', postcode: '94105', country: 'US' },
      line_items: [{ id: 1, product_id: 55, quantity: 1, total: '32.00', name: 'Canvas tote' }],
    })
    expect('error' in order).toBe(false)
  })
})
