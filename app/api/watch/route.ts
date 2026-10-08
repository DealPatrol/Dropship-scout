import { NextResponse } from 'next/server'
import { saveWatchSubscriber } from '@/lib/db'
import { normalizeWatchEmail, publicWatchError, watchSource } from '@/lib/watch-email'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  const record = body as { email?: unknown; source?: unknown; company?: unknown }
  if (typeof record.company === 'string' && record.company.trim().length > 0) {
    return NextResponse.json({ ok: true })
  }
  const email = normalizeWatchEmail(record.email)
  if (!email) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  try {
    await saveWatchSubscriber(email, watchSource(record.source))
  } catch (err) {
    const failure = publicWatchError(err)
    return NextResponse.json({ error: failure.message }, { status: failure.status })
  }
  return NextResponse.json({ ok: true })
}
