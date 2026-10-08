// lib/fulfillment.ts
// Fulfillment order management — formats products for Shopify and tracks order state

import { Product } from './types'
import { shopifyApiVersion, shopifyErrorMessage } from './shopify'

export interface ShopifyProductPayload {
  product: {
    title: string
    body_html: string
    vendor: string
    handle: string
    product_type: string
    tags: string
    status: string
    variants: ShopifyVariant[]
    images?: { src: string; alt: string }[]
  }
}

interface ShopifyVariant {
  price: string
  compare_at_price: string
  inventory_quantity: number
  inventory_management: string
  requires_shipping: boolean
  taxable: boolean
  sku: string
}

export function buildShopifyPayload(product: Product): ShopifyProductPayload {
  const compareAtPrice = (parseFloat(product.sellPrice) * 1.3).toFixed(2)
  const sku = 'DS-' + product.name.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '') + '-001'

  return {
    product: {
      title: product.name,
      handle: shopifyProductHandle(product),
      body_html: `<p>${product.aiInsight}</p>`,
      vendor: 'DropShip Scout',
      product_type: product.category,
      tags: [...(product.tags || []), product.category, 'dropship'].join(', '),
      status: 'active',
      variants: [{
        price: product.sellPrice,
        compare_at_price: compareAtPrice,
        inventory_quantity: 99,
        inventory_management: 'shopify',
        requires_shipping: true,
        taxable: true,
        sku,
      }],
      ...(product.imageUrl ? { images: [{ src: product.imageUrl, alt: product.name }] } : {}),
    },
  }
}

export function shopifyProductHandle(product: Product): string {
  const source = product.id || product.name
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180)
  return `dropship-scout-${slug || 'product'}`
}

export async function pushProductToShopify(
  domain: string,
  token: string,
  product: Product
): Promise<{ success: boolean; shopifyId?: string; error?: string }> {
  try {
    const payload = buildShopifyPayload(product)
    const handle = payload.product.handle
    const existingResponse = await fetch(
      `https://${domain}/admin/api/${shopifyApiVersion()}/products.json?handle=${encodeURIComponent(handle)}&fields=id,handle&limit=1`,
      {
        headers: {
          'X-Shopify-Access-Token': token,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }
    )
    const existingBody = await existingResponse.json().catch(() => null)
    if (!existingResponse.ok) {
      return {
        success: false,
        error: `Could not check for an existing Shopify listing: ${shopifyErrorMessage(existingBody, existingResponse.status)}`,
      }
    }
    const existingId = existingBody?.products?.[0]?.id
    if (existingId) {
      return { success: true, shopifyId: String(existingId) }
    }

    const res = await fetch(`https://${domain}/admin/api/${shopifyApiVersion()}/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    })

    const json = await res.json().catch(() => null)
    if (res.ok) {
      return { success: true, shopifyId: String(json.product?.id || '') }
    }
    return { success: false, error: shopifyErrorMessage(json, res.status) }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export function calculateFulfillmentCost(sourcePrice: number, shippingEstimate = 2.5): number {
  return parseFloat((sourcePrice + shippingEstimate).toFixed(2))
}

export function calculateNetProfit(sellPrice: number, sourcePrice: number, fees = 0): number {
  return parseFloat((sellPrice - sourcePrice - fees).toFixed(2))
}
