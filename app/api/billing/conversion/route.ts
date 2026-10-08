import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { claimPurchaseConversion } from '@/lib/db'

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const claimed = await claimPurchaseConversion(user.id)
  if (!claimed) return NextResponse.json({ claimed: false })
  return NextResponse.json({ claimed: true, ...claimed })
}
