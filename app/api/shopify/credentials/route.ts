// app/api/shopify/credentials/route.ts
// Saves and retrieves Shopify store credentials for a logged-in user.
// Token is stored server-side in Supabase and never sent back to the browser.

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/shopify/credentials?userId=xxx
// Returns ONLY the domain (not the token) — so the UI can pre-fill the domain field
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('shopify_domain')
    .eq('id', userId)
    .single()

  if (error) return NextResponse.json({ domain: null })
  return NextResponse.json({ domain: data?.shopify_domain || null })
}

// POST /api/shopify/credentials
// Body: { userId, domain, token }
export async function POST(req: NextRequest) {
  const { userId, domain, token } = await req.json()
  if (!userId || !domain || !token) {
    return NextResponse.json(
      { error: 'userId, domain, and token are required' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      shopify_domain: domain,
      shopify_token_enc: token, // In production: encrypt before storing
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/shopify/credentials?userId=xxx
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ shopify_domain: null, shopify_token_enc: null })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
