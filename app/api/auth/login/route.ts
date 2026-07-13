// app/api/auth/login/route.ts
// POST: verify credentials and start a session

import { NextRequest, NextResponse } from 'next/server'
import { verifyUser } from '@/lib/auth'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  try {
    const user = await verifyUser(String(email), String(password))
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    const token = await createSessionToken(user)
    const res = NextResponse.json({ user })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
