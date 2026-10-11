import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { deleteLaunch, getLaunch, updateLaunch } from '@/lib/launch-db'
import { validateLaunchWorkspace, LaunchValidationError } from '@/lib/launch-workspace'

export const dynamic = 'force-dynamic'
type Context = { params: { id: string } }
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!validId(params.id)) return NextResponse.json({ error: 'Invalid workspace ID' }, { status: 400 })
    const launch = await getLaunch(user.id, params.id)
    if (!launch) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    return NextResponse.json({ launch })
  } catch { return NextResponse.json({ error: 'Unable to load launch workspace' }, { status: 500 }) }
}
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!validId(params.id)) return NextResponse.json({ error: 'Invalid workspace ID' }, { status: 400 })
    let raw: unknown
    try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
    const launch = await updateLaunch(user.id, params.id, validateLaunchWorkspace(raw))
    if (!launch) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    return NextResponse.json({ launch })
  } catch (error) {
    if (error instanceof LaunchValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Unable to update launch workspace' }, { status: 500 })
  }
}
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!validId(params.id)) return NextResponse.json({ error: 'Invalid workspace ID' }, { status: 400 })
    if (!await deleteLaunch(user.id, params.id)) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Unable to delete launch workspace' }, { status: 500 }) }
}
