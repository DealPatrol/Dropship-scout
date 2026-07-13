// app/api/shopify/push/route.ts
// Pushes products to Shopify Admin API.
// The Shopify access token NEVER touches the browser — it's sent here and used server-side.

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface PushProduct {
  name: string
  category: string
  aiInsight: string
  rating: number
  monthlySales: string
  sellPrice: string
  tags: string[]
  imageUrl?: string
}

export async function POST(req: NextRequest) {
  const { domain, token, products, userId } = await req.json()

  if (!domain || !token || !products?.length) {
    return NextResponse.json({ error: 'domain, token, and products are required' }, { status: 400 })
  }

  const results = []

  for (const p of products as PushProduct[]) {
    try {
      const shopifyProduct = {
        product: {
          title: p.name,
          body_html: `<p>${p.aiInsight}</p><p><strong>Rating:</strong> ${p.rating}/5 &nbsp;|&nbsp; <strong>Monthly Sales:</strong> ${p.monthlySales}</p>`,
          vendor: 'DropShip Scout',
          product_type: p.category,
          tags: [...(p.tags || []), p.category, 'dropship'].join(', '),
          status: 'active',
          variants: [{
            price: p.sellPrice,
            compare_at_price: (parseFloat(p.sellPrice) * 1.3).toFixed(2),
            inventory_quantity: 99,
            inventory_management: 'shopify',
            requires_shipping: true,
            taxable: true,
            sku: 'DS-' + p.name.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '') + '-001',
          }],
          ...(p.imageUrl ? { images: [{ src: p.imageUrl, alt: p.name }] } : {}),
        }
      }

      const res = await fetch(`https://${domain}/admin/api/2024-01/products.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify(shopifyProduct),
      })

      const json = await res.json()

      if (res.ok) {
        results.push({ success: true, name: p.name, shopifyId: json.product?.id })

        // Log to push_history if user is logged in
        if (userId) {
          await supabaseAdmin.from('push_history').insert({
            user_id: userId,
            shopify_product_id: String(json.product?.id || ''),
            product_name: p.name,
            sell_price: parseFloat(p.sellPrice),
            status: 'success',
          })
        }
      } else {
        const errMsg = JSON.stringify(json?.errors || 'Unknown Shopify error')
        results.push({ success: false, name: p.name, error: errMsg })

        if (userId) {
          await supabaseAdmin.from('push_history').insert({
            user_id: userId,
            product_name: p.name,
            sell_price: parseFloat(p.sellPrice),
            status: 'failed',
            error_message: errMsg,
          })
        }
      }
    } catch (err: any) {
      results.push({ success: false, name: p.name, error: err.message })
    }
  }

  const pushed = results.filter(r => r.success).length
  return NextResponse.json({ pushed, total: products.length, results })
}
