import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isSellableProvider } from '@/lib/commerce/types'
import { supplierGateway } from '@/lib/supplier-api'
import { listImportedProducts, upsertSupplierProduct } from '@/lib/store-db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const products = await listImportedProducts()
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as { provider?: string; query?: string } | null
  const provider = body?.provider ?? ''
  if (provider !== 'cj' && provider !== 'printful' && provider !== 'printify') {
    return NextResponse.json({ error: 'Choose CJ, Printful, or Printify.' }, { status: 400 })
  }
  if (!isSellableProvider(provider)) {
    return NextResponse.json({ error: 'Unsupported supplier.' }, { status: 400 })
  }
  const gateway = supplierGateway(provider)
  if (!gateway.configured()) {
    return NextResponse.json({ error: gateway.missingConfiguration() }, { status: 503 })
  }
  try {
    const imported = await gateway.search(body?.query ?? '')
    const ids = []
    for (const product of imported) {
      ids.push(await upsertSupplierProduct({
        provider: product.provider,
        externalId: product.externalId,
        variantId: product.variantId,
        title: product.title,
        description: product.description,
        imageUrl: product.imageUrl,
        costCents: product.costCents,
        shippingCents: product.shippingCents,
        sku: product.sku,
        stock: product.stock,
        available: product.available,
      }))
    }
    return NextResponse.json({ imported: ids.length, products: await listImportedProducts(provider) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Supplier import failed' },
      { status: 502 }
    )
  }
}
