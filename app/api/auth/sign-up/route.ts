// app/api/auth/sign-up/route.ts
// POST: create an account and start a session

import { NextRequest, NextResponse } from 'next/server'
import { attributionFromCookieValue, attributionFromUnknown, mergeAttribution } from '@/lib/attribution'
import { createUser } from '@/lib/auth'
import { saveAccountAttribution } from '@/lib/db'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password } = body as { email?: unknown; password?: unknown }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  try {
    const user = await createUser(String(email), String(password))
    const attribution = mergeAttribution(
      attributionFromCookieValue(req.cookies.get('ds_attr')?.value),
      attributionFromUnknown((body as { attribution?: unknown }).attribution),
    )
    if (attribution) await saveAccountAttribution(user.id, attribution)
    const token = await createSessionToken(user)
    const res = NextResponse.json({ user })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign up failed'
    const status = message.includes('already exists') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
