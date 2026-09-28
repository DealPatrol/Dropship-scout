import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listApiSuppliers } from '@/lib/supplier-api'
import { listDirectCatalog } from '@/lib/store-db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [products, sources] = await Promise.all([
    listDirectCatalog(),
    Promise.resolve(listApiSuppliers()),
  ])
  return NextResponse.json({ products, sources })
}
