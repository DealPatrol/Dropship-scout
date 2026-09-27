// app/api/shopify/credentials/route.ts
// Saves and retrieves Shopify store credentials for a logged-in user.
// Token is stored server-side in Postgres and never sent back to the browser.

import { NextRequest, NextResponse } from 'next/server'
import {
  clearShopifyCredentials,
  getShopifyCredentials,
  getShopifyDomain,
  saveShopifyCredentials,
} from '@/lib/db'
import { getSession } from '@/lib/auth'
import { normalizeShopifyDomain, validateShopifyConnection } from '@/lib/shopify'

// GET /api/shopify/credentials
// Returns ONLY the domain (not the token) — so the UI can pre-fill the domain field
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const domain = await getShopifyDomain(user.id)
    return NextResponse.json({ domain })
  } catch {
    return NextResponse.json({ domain: null })
  }
}

// POST /api/shopify/credentials
// Body: { domain, token }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domain, token } = await req.json()
  if (!domain) {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 })
  }

  try {
    const normalizedDomain = normalizeShopifyDomain(String(domain))
    const existing = await getShopifyCredentials(user.id)
    const tokenToValidate = token || (
      existing?.domain === normalizedDomain ? existing.token : null
    )
    if (!tokenToValidate) {
      return NextResponse.json(
        { error: 'An access token is required when connecting or changing stores' },
        { status: 400 }
      )
    }

    const validation = await validateShopifyConnection(normalizedDomain, tokenToValidate)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await saveShopifyCredentials(user.id, normalizedDomain, token || null)
    return NextResponse.json({
      success: true,
      domain: normalizedDomain,
      shopName: validation.shopName,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save credentials'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/shopify/credentials
export async function DELETE() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await clearShopifyCredentials(user.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to clear credentials'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
