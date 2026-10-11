import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserPlan } from '@/lib/db'
import { createLaunch, listLaunches, LaunchLimitError } from '@/lib/launch-db'
import { validateLaunchWorkspace, LaunchValidationError } from '@/lib/launch-workspace'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const [launches, plan] = await Promise.all([listLaunches(user.id), getUserPlan(user.id)])
    return NextResponse.json({ launches, plan, limit: plan === 'pro' ? 50 : 3 })
  } catch { return NextResponse.json({ error: 'Unable to load launch workspaces' }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let raw: unknown
    try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
    const payload = validateLaunchWorkspace(raw)
    const launch = await createLaunch(user.id, payload)
    return NextResponse.json({ launch }, { status: 201 })
  } catch (error) {
    if (error instanceof LaunchValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
    if (error instanceof LaunchLimitError) return NextResponse.json({ error: error.message, code: 'PLAN_LIMIT' }, { status: 402 })
    return NextResponse.json({ error: 'Unable to save launch workspace' }, { status: 500 })
  }
}
