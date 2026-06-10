// app/api/shopify/push/route.ts
// Pushes products to Shopify Admin API.
// The Shopify access token NEVER touches the browser — fetched server-side from the user's profile.

import { NextRequest, NextResponse } from 'next/server'
import { pushProductToShopify } from '@/lib/fulfillment'
import { logPushResult } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'
import { Product } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { userId, products } = await req.json()

  if (!userId || !products?.length) {
    return NextResponse.json({ error: 'userId and products are required' }, { status: 400 })
  }

  // Fetch stored Shopify credentials server-side — token never comes from the browser
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('shopify_domain, shopify_token_enc')
    .eq('id', userId)
    .single()

  if (profileError || !profile?.shopify_domain || !profile?.shopify_token_enc) {
    return NextResponse.json(
      { error: 'Shopify not connected. Add your credentials in Settings.' },
      { status: 400 }
    )
  }

  const { shopify_domain: domain, shopify_token_enc: token } = profile
  const results = []

  for (const p of products as Product[]) {
    const result = await pushProductToShopify(domain, token, p)

    results.push({ name: p.name, ...result })

    await logPushResult({
      userId,
      productName: p.name,
      sellPrice: parseFloat(p.sellPrice),
      status: result.success ? 'success' : 'failed',
      shopifyProductId: result.shopifyId,
      errorMessage: result.error,
    })
  }

  const pushed = results.filter(r => r.success).length
  return NextResponse.json({ pushed, total: products.length, results })
}
