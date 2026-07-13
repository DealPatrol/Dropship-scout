// app/api/shopify/credentials/route.ts
// Saves and retrieves Shopify store credentials for a logged-in user.
// Token is stored server-side in Postgres and never sent back to the browser.

import { NextRequest, NextResponse } from 'next/server'
import { clearShopifyCredentials, getShopifyDomain, saveShopifyCredentials } from '@/lib/db'

// GET /api/shopify/credentials?userId=xxx
// Returns ONLY the domain (not the token) — so the UI can pre-fill the domain field
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    const domain = await getShopifyDomain(userId)
    return NextResponse.json({ domain })
  } catch {
    return NextResponse.json({ domain: null })
  }
}

// POST /api/shopify/credentials
// Body: { userId, domain, token }
export async function POST(req: NextRequest) {
  const { userId, domain, token } = await req.json()
  if (!userId || !domain) {
    return NextResponse.json({ error: 'userId and domain are required' }, { status: 400 })
  }

  try {
    await saveShopifyCredentials(userId, domain, token || null)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save credentials'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/shopify/credentials?userId=xxx
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    await clearShopifyCredentials(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to clear credentials'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
