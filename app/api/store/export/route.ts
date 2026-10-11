import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { exportCatalogCsv, parseCatalogExportChannel } from '@/lib/catalog-export'
import { getSupplierProduct, listSellerListings } from '@/lib/store-db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let channel
    try {
      channel = parseCatalogExportChannel(req.nextUrl.searchParams.get('channel'))
    } catch {
      return NextResponse.json({ error: 'Export channel must be shopify or etsy.' }, { status: 400 })
    }
    // Query scope is always the authenticated seller, never a caller-provided ID.
    const listings = await listSellerListings(user.id)
    const supplierIds = Array.from(new Set(listings.map(listing => listing.supplierProductId)))
    const details = new Map<string, Awaited<ReturnType<typeof getSupplierProduct>>>()
    // Bound concurrent reads when a merchant has a large catalog.
    for (let offset = 0; offset < supplierIds.length; offset += 20) {
      const batch = await Promise.all(supplierIds.slice(offset, offset + 20).map(async id =>
        [id, await getSupplierProduct(id)] as const))
      for (const [id, detail] of batch) details.set(id, detail)
    }
    const catalog = listings.map(listing => {
      const product = details.get(listing.supplierProductId)
      return { ...listing, sku: product?.sku ?? null, stock: product?.stock ?? null }
    })
    const { csv, filename } = exportCatalogCsv(catalog, channel)
    return new NextResponse(csv, { headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } })
  } catch {
    return NextResponse.json({ error: 'Could not export the catalog. Please try again.' }, { status: 500,
      headers: { 'Cache-Control': 'private, no-store' } })
  }
}
