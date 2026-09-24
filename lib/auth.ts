// lib/auth.ts
// Server-side auth helpers: read the session in Server Components / route
// handlers, and email/password account management against Postgres.

import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { ensureSchema, sql } from './database'
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from './session'

/** Current user from the session cookie, or null. */
export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function createUser(email: string, password: string): Promise<SessionUser> {
  await ensureSchema()
  const passwordHash = await bcrypt.hash(password, 10)
  const rows = await sql`
    insert into users (email, password_hash)
    values (${email.toLowerCase().trim()}, ${passwordHash})
    on conflict (email) do nothing
    returning id, email
  `
  if (rows.length === 0) {
    throw new Error('An account with this email already exists')
  }
  return { id: rows[0].id, email: rows[0].email }
}

export async function verifyUser(email: string, password: string): Promise<SessionUser | null> {
  await ensureSchema()
  const rows = await sql`
    select id, email, password_hash from users where email = ${email.toLowerCase().trim()}
  `
  if (rows.length === 0) return null
  const valid = await bcrypt.compare(password, rows[0].password_hash)
  if (!valid) return null
  return { id: rows[0].id, email: rows[0].email }
}
