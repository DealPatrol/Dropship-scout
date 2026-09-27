// app/api/shopify/validate/route.ts
// Tests a Shopify store connection without persisting credentials

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { validateShopifyConnection } from '@/lib/shopify'

// POST /api/shopify/validate
// Body: { domain, token }
// Returns: { valid: boolean, shopName?: string, error?: string }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domain, token } = await req.json()

  if (!domain || !token) {
    return NextResponse.json({ error: 'domain and token are required' }, { status: 400 })
  }

  return NextResponse.json(await validateShopifyConnection(domain, token))
}
