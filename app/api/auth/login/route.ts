// app/api/auth/login/route.ts
// POST: verify credentials and start a session

import { NextRequest, NextResponse } from 'next/server'
import { attributionFromCookieValue, attributionFromUnknown, mergeAttribution } from '@/lib/attribution'
import { verifyUser } from '@/lib/auth'
import { saveAccountAttribution } from '@/lib/db'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password } = body as { email?: unknown; password?: unknown }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  try {
    const user = await verifyUser(String(email), String(password))
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    const attribution = mergeAttribution(
      attributionFromCookieValue(req.cookies.get('ds_attr')?.value),
      attributionFromUnknown((body as { attribution?: unknown }).attribution),
    )
    if (attribution) await saveAccountAttribution(user.id, attribution, true)
    const token = await createSessionToken(user)
    const res = NextResponse.json({ user })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
