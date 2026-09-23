// app/api/auth/sign-up/route.ts
// POST: create an account and start a session

import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  try {
    const user = await createUser(String(email), String(password))
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
