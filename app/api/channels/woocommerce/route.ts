import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { clearWooCredentials, saveWooCredentials } from '@/lib/channel-db'
import { normalizeWooUrl, validateWooConnection } from '@/lib/channels/woocommerce-admin'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as {
    url?: string
    key?: string
    secret?: string
  } | null
  const url = normalizeWooUrl(body?.url ?? '')
  const key = body?.key?.trim() ?? ''
  const secret = body?.secret?.trim() ?? ''
  if (!url) {
    return NextResponse.json({ error: 'Store URL must be an https origin without embedded credentials.' }, { status: 400 })
  }
  if (!key || !secret) {
    return NextResponse.json({ error: 'Consumer key and secret are required.' }, { status: 400 })
  }
  const validation = await validateWooConnection(url, key, secret)
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })
  await saveWooCredentials(user.id, url, key, secret)
  return NextResponse.json({ url })
}

export async function DELETE() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await clearWooCredentials(user.id)
  return NextResponse.json({ ok: true })
}
