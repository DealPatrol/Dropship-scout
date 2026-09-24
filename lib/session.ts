// lib/session.ts
// Signed-cookie sessions with jose (edge-safe: used by middleware and
// server code alike). Replaces Supabase Auth.

import { jwtVerify, SignJWT } from 'jose'

export const SESSION_COOKIE = 'ds_session'
const SESSION_DAYS = 30

export interface SessionUser {
  id: string
  email: string
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('Missing required environment variable: AUTH_SECRET')
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || typeof payload.email !== 'string') return null
    return { id: payload.sub, email: payload.email }
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60,
}
