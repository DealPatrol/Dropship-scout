import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { PLAN_LIMITS } from '@/lib/billing'
import { getUserPlan } from '@/lib/db'
import {
  getSupplierAdapter,
  listSupplierSources,
  type SupplierSourceId,
} from '@/lib/supplier-data'

const SOURCE_IDS = new Set<SupplierSourceId>(['demo', 'cj'])

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requestedSource = req.nextUrl.searchParams.get('source')
  if (!requestedSource) {
    return NextResponse.json({ sources: listSupplierSources() })
  }
  if (!SOURCE_IDS.has(requestedSource as SupplierSourceId)) {
    return NextResponse.json({ error: 'Unknown supplier source' }, { status: 400 })
  }

  const sourceId = requestedSource as SupplierSourceId
  const plan = await getUserPlan(user.id)
  if (sourceId !== 'demo' && !PLAN_LIMITS[plan].liveSupplierData) {
    return NextResponse.json(
      { error: 'Live supplier data is a Pro feature.', code: 'PLAN_LIMIT' },
      { status: 403 }
    )
  }

  try {
    const adapter = getSupplierAdapter(sourceId)
    const result = await adapter.search({
      query: req.nextUrl.searchParams.get('query') || undefined,
      page: Number(req.nextUrl.searchParams.get('page') || 1),
      pageSize: Number(req.nextUrl.searchParams.get('pageSize') || 25),
    })
    return NextResponse.json({
      source: adapter.source,
      products: result.products,
      total: result.total,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Supplier search failed' },
      { status: 502 }
    )
  }
}
