// lib/fulfillment.ts
// Fulfillment order management — formats products for Shopify and tracks order state

import { Product } from './types'

export interface ShopifyProductPayload {
  product: {
    title: string
    body_html: string
    vendor: string
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
      body_html: `<p>${product.aiInsight}</p><p><strong>Rating:</strong> ${product.rating}/5 &nbsp;|&nbsp; <strong>Monthly Sales:</strong> ${product.monthlySales}</p>`,
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

export async function pushProductToShopify(
  domain: string,
  token: string,
  product: Product
): Promise<{ success: boolean; shopifyId?: string; error?: string }> {
  try {
    const payload = buildShopifyPayload(product)
    const res = await fetch(`https://${domain}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (res.ok) {
      return { success: true, shopifyId: String(json.product?.id || '') }
    }
    return { success: false, error: JSON.stringify(json?.errors || 'Unknown Shopify error') }
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
