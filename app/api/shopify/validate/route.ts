// app/api/shopify/validate/route.ts
// Tests a Shopify store connection without persisting credentials

import { NextRequest, NextResponse } from 'next/server'

// POST /api/shopify/validate
// Body: { domain, token }
// Returns: { valid: boolean, shopName?: string, error?: string }
export async function POST(req: NextRequest) {
  const { domain, token } = await req.json()

  if (!domain || !token) {
    return NextResponse.json({ error: 'domain and token are required' }, { status: 400 })
  }

  // Basic domain format check
  if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(domain)) {
    return NextResponse.json({
      valid: false,
      error: 'Domain must be in format: your-store.myshopify.com',
    })
  }

  try {
    const res = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    })

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ valid: false, error: 'Invalid access token' })
    }

    if (!res.ok) {
      return NextResponse.json({ valid: false, error: `Shopify returned ${res.status}` })
    }

    const json = await res.json()
    return NextResponse.json({
      valid: true,
      shopName: json.shop?.name || domain,
      plan: json.shop?.plan_name || null,
      currency: json.shop?.currency || null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.json({ valid: false, error: message })
  }
}
