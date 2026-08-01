import type { ShippingAddress } from '@/lib/types'

export interface WebhookOrder {
  storeOrderId: string
  customerName: string
  customerEmail: string
  shippingAddress: ShippingAddress
  items: WebhookOrderItem[]
  totalAmount: number
}

export interface WebhookOrderItem {
  title: string
  quantity: number
  price: number
  sku?: string
  image?: string
}

/**
 * Detect webhook format and parse to standard format
 * Supports: Shopify, WooCommerce, BigCommerce, generic JSON
 */
export function parseWebhookOrder(body: any): WebhookOrder | null {
  try {
    // Shopify webhook format
    if (body.order?.id && body.order?.email) {
      return parseShopifyWebhook(body)
    }

    // WooCommerce webhook format
    if (body.id && body.billing?.email) {
      return parseWooCommerceWebhook(body)
    }

    // BigCommerce webhook format
    if (body.data?.order?.id && body.data?.order?.email) {
      return parseBigCommerceWebhook(body)
    }

    // Generic/custom JSON format
    if (body.order_id && body.customer_email) {
      return parseGenericWebhook(body)
    }

    return null
  } catch (error) {
    console.error('[v0] Webhook parse error:', error)
    return null
  }
}

function parseShopifyWebhook(body: any): WebhookOrder {
  const order = body.order
  return {
    storeOrderId: `shopify_${order.id}`,
    customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
    customerEmail: order.email,
    shippingAddress: {
      firstName: order.shipping_address?.first_name,
      lastName: order.shipping_address?.last_name,
      street: order.shipping_address?.address1,
      city: order.shipping_address?.city,
      state: order.shipping_address?.province_code,
      country: order.shipping_address?.country_code,
      postalCode: order.shipping_address?.zip,
    },
    items: order.line_items.map((item: any) => ({
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku,
      image: item.image?.src,
    })),
    totalAmount: parseFloat(order.total_price),
  }
}

function parseWooCommerceWebhook(body: any): WebhookOrder {
  return {
    storeOrderId: `woocommerce_${body.id}`,
    customerName: `${body.billing?.first_name || ''} ${body.billing?.last_name || ''}`.trim(),
    customerEmail: body.billing?.email,
    shippingAddress: {
      firstName: body.shipping?.first_name,
      lastName: body.shipping?.last_name,
      street: body.shipping?.address_1,
      city: body.shipping?.city,
      state: body.shipping?.state,
      country: body.shipping?.country,
      postalCode: body.shipping?.postcode,
    },
    items: body.line_items.map((item: any) => ({
      title: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku,
      image: item.image?.src,
    })),
    totalAmount: parseFloat(body.total),
  }
}

function parseBigCommerceWebhook(body: any): WebhookOrder {
  const order = body.data.order
  return {
    storeOrderId: `bigcommerce_${order.id}`,
    customerName: order.customer_name,
    customerEmail: order.email,
    shippingAddress: {
      firstName: order.shipping_addresses[0]?.first_name,
      lastName: order.shipping_addresses[0]?.last_name,
      street: order.shipping_addresses[0]?.street_1,
      city: order.shipping_addresses[0]?.city,
      state: order.shipping_addresses[0]?.state,
      country: order.shipping_addresses[0]?.country,
      postalCode: order.shipping_addresses[0]?.postal_code,
    },
    items: order.products.map((item: any) => ({
      title: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price_ex_tax),
      sku: item.sku,
      image: item.product_options?.[0]?.display_value,
    })),
    totalAmount: parseFloat(order.total_ex_tax),
  }
}

function parseGenericWebhook(body: any): WebhookOrder {
  // Generic/custom format - tries to extract common fields
  return {
    storeOrderId: body.order_id || body.id,
    customerName: body.customer_name || body.name || '',
    customerEmail: body.customer_email || body.email || '',
    shippingAddress: {
      firstName: body.shipping_first_name,
      lastName: body.shipping_last_name,
      street: body.shipping_address,
      city: body.shipping_city,
      state: body.shipping_state,
      country: body.shipping_country,
      postalCode: body.shipping_zip,
    },
    items: (body.items || body.line_items || []).map((item: any) => ({
      title: item.title || item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku,
      image: item.image,
    })),
    totalAmount: parseFloat(body.total_amount || body.total),
  }
}
