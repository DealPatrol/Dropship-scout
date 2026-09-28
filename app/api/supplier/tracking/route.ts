import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { saveDirectTracking } from '@/lib/store-db'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as {
    jobId?: string
    trackingNumber?: string
    trackingUrl?: string
    carrier?: string
  } | null
  const trackingNumber = body?.trackingNumber?.trim() ?? ''
  if (!body?.jobId || trackingNumber.length < 4) {
    return NextResponse.json({ error: 'A tracking number is required.' }, { status: 400 })
  }
  const saved = await saveDirectTracking({
    userId: user.id,
    jobId: body.jobId,
    trackingNumber,
    trackingUrl: body.trackingUrl?.trim(),
    carrier: body.carrier?.trim(),
  })
  if (!saved) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
