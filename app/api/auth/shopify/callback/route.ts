import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db/index'
import { storeConnections } from '@/lib/db/schema'

// This route handles Shopify OAuth callback
// Exchange authorization code for access token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const shop = searchParams.get('shop')
    const state = searchParams.get('state')
    const hmac = searchParams.get('hmac')

    if (!code || !shop) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify state parameter for CSRF protection
    // In production, validate the state against session state
    if (!state) {
      return NextResponse.json(
        { error: 'Missing state parameter' },
        { status: 400 }
      )
    }

    // Get current user session
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      }
    )

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to exchange code for token' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token returned' },
        { status: 500 }
      )
    }

    // Store the connection in database
    await db.insert(storeConnections).values({
      userId: session.user.id,
      platform: 'shopify',
      storeName: shop.replace('.myshopify.com', ''),
      storeUrl: `https://${shop}`,
      accessToken,
      isActive: true,
      webhooksConfigured: false,
      metadata: {
        shopifyShop: shop,
        scopes: tokenData.scope,
      },
    })

    // Redirect to stores page with success message
    return NextResponse.redirect(
      new URL('/dashboard/stores?connected=shopify', req.url)
    )
  } catch (error) {
    console.error('Shopify OAuth error:', error)
    return NextResponse.json(
      { error: 'OAuth callback failed' },
      { status: 500 }
    )
  }
}
