import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSlug } from '@/lib/commerce/money'
import { createSupplierProfile, getSupplierProfileForUser, updateSupplierNotifyUrl } from '@/lib/store-db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getSupplierProfileForUser(user.id)
  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as {
    displayName?: string
    slug?: string
    notifyUrl?: string
  } | null
  const existing = await getSupplierProfileForUser(user.id)
  const notifyUrl = body?.notifyUrl?.trim() || null
  if (notifyUrl && !notifyUrl.startsWith('https://')) {
    return NextResponse.json({ error: 'Notification URL must start with https://' }, { status: 400 })
  }
  if (existing) {
    await updateSupplierNotifyUrl(user.id, notifyUrl)
    return NextResponse.json({ profile: await getSupplierProfileForUser(user.id) })
  }
  const displayName = body?.displayName?.trim() ?? ''
  const slug = body?.slug?.trim().toLowerCase() ?? ''
  if (displayName.length < 2 || displayName.length > 60) {
    return NextResponse.json({ error: 'Supplier name must be 2–60 characters.' }, { status: 400 })
  }
  if (!isSlug(slug)) {
    return NextResponse.json({ error: 'Supplier link must be 3–40 characters: lowercase letters, numbers, and hyphens.' }, { status: 400 })
  }
  try {
    const profile = await createSupplierProfile({ userId: user.id, displayName, slug, notifyUrl })
    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create supplier' }, { status: 400 })
  }
}
