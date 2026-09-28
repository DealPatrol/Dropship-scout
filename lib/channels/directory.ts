export type ChannelStatus = 'live' | 'coming_soon'
export type ChannelId = 'hosted' | 'shopify' | 'woocommerce' | 'etsy' | 'ebay' | 'tiktok'

export interface SalesChannel {
  id: ChannelId
  name: string
  status: ChannelStatus
  summary: string
  detail: string
}

/**
 * Live means this app can validate credentials and call the platform API.
 * Coming soon means a public API exists, but connecting it would require an
 * app review or partner approval this deployment does not complete.
 */
export const SALES_CHANNELS: SalesChannel[] = [
  {
    id: 'hosted',
    name: 'Dropship Scout storefront',
    status: 'live',
    summary: 'The default store. Product pages, cart, and Stripe checkout are served by this app.',
    detail: 'No external shop is required. Stripe collects the payment, then the supplier order and Connect transfers run automatically.',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    status: 'live',
    summary: 'Sync published catalog products and pull paid orders into supplier fulfillment.',
    detail: 'Uses the Shopify Admin API with a custom-app access token. The token is checked against the shop before it is saved. Customer payment stays in Shopify, so this app records the same cost split and does not create a Stripe transfer.',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    status: 'live',
    summary: 'Sync published products and pull processing orders from a WooCommerce REST API.',
    detail: 'Uses a REST API consumer key and secret over HTTPS. The connection is saved only after WooCommerce accepts the key. Customer payment stays in WooCommerce.',
  },
  {
    id: 'etsy',
    name: 'Etsy',
    status: 'coming_soon',
    summary: 'Etsy Open API v3 can list products and read shop receipts.',
    detail: 'A connection needs an Etsy app that has passed Etsy app review and OAuth. This deployment does not start that OAuth flow.',
  },
  {
    id: 'ebay',
    name: 'eBay',
    status: 'coming_soon',
    summary: 'The eBay Sell API can publish inventory and read orders.',
    detail: 'A connection needs an eBay developer application and a user OAuth token. This deployment does not start that OAuth flow.',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    status: 'coming_soon',
    summary: 'TikTok Shop Partner API can sync products and orders.',
    detail: 'A connection needs an approved TikTok Shop partner app. This deployment does not start that authorization flow.',
  },
]

export function salesChannel(id: ChannelId): SalesChannel {
  const channel = SALES_CHANNELS.find(item => item.id === id)
  if (!channel) throw new Error(`Unknown sales channel: ${id}`)
  return channel
}
