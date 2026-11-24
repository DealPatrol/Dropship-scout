// POST /api/account/delete
// Body: { password: string, confirm: "DELETE" }
// Permanently deletes the signed-in account (App Review Guideline 5.1.1(v)).

import { NextResponse } from 'next/server'
import { getSession, verifyUser } from '@/lib/auth'
import { AccountDeletionBlockedError, deleteAccount } from '@/lib/account-deletion'
import { SESSION_COOKIE } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Sign in to delete your account.' }, { status: 401 })

  const body = await request.json().catch(() => null) as { password?: unknown; confirm?: unknown } | null
  if (body?.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 })
  }
  if (typeof body.password !== 'string' || !body.password) {
    return NextResponse.json({ error: 'Enter your password to confirm.' }, { status: 400 })
  }
  const verified = await verifyUser(user.email, body.password)
  if (!verified || verified.id !== user.id) {
    return NextResponse.json({ error: 'That password is not correct.' }, { status: 403 })
  }

  try {
    const result = await deleteAccount(user.id)
    const res = NextResponse.json(result)
    res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
    return res
  } catch (err) {
    if (err instanceof AccountDeletionBlockedError) return NextResponse.json({ error: err.message }, { status: 409 })
    return NextResponse.json({ error: 'Account deletion failed. Nothing was deleted. Try again or contact support.' }, { status: 500 })
  }
}
