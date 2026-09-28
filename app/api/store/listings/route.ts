import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { PLAN_LIMITS } from '@/lib/billing'
import { assessListingPrice } from '@/lib/commerce/listing-price'
import { platformFeeBps } from '@/lib/commerce/modes'
import { slugify } from '@/lib/commerce/money'
import { settlementFor } from '@/lib/commerce/types'
import { getUserPlan } from '@/lib/db'
import {
  countListings,
  createListing,
  getStoreProfile,
  getSupplierProduct,
  listSellerListings,
  updateListing,
} from '@/lib/store-db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const listings = await listSellerListings(user.id)
  return NextResponse.json({ listings, platformFeeBps: platformFeeBps() })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as {
    supplierProductId?: string
    title?: string
    priceCents?: number
    published?: boolean
  } | null
  if (!body?.supplierProductId || !body.title?.trim() || !Number.isInteger(body.priceCents)) {
    return NextResponse.json({ error: 'Product, title, and price are required.' }, { status: 400 })
  }
  const product = await getSupplierProduct(body.supplierProductId)
  if (!product || !product.available) {
    return NextResponse.json({ error: 'That supplier product is not available.' }, { status: 404 })
  }
  if (product.provider === 'direct' && !product.supplierProfileId) {
    return NextResponse.json({ error: 'Direct supplier product is incomplete.' }, { status: 400 })
  }
  const plan = await getUserPlan(user.id)
  const limit = PLAN_LIMITS[plan].catalogProducts
  if (limit !== null && await countListings(user.id) >= limit) {
    return NextResponse.json({ error: `Free plan limit reached: ${limit} store listings. Upgrade to Pro for unlimited listings.` }, { status: 402 })
  }
  const priceCents = body.priceCents as number
  const assessment = assessListingPrice({
    priceCents,
    costCents: product.costCents,
    shippingCents: product.shippingCents,
    platformFeeBps: platformFeeBps(),
    settlement: settlementFor(product.provider),
  })
  if (!assessment.ok) {
    return NextResponse.json({ error: assessment.reason || 'Price does not cover supplier cost and fees.' }, { status: 400 })
  }
  const profile = await getStoreProfile(user.id)
  const published = Boolean(body.published) && profile?.connectTransfersStatus === 'active' && profile.storePublished
  try {
    const id = await createListing({
      sellerUserId: user.id,
      supplierProductId: product.id,
      title: body.title.trim().slice(0, 140),
      description: product.description,
      priceCents,
      slug: `${slugify(body.title, 32) || 'product'}-${randomUUID().slice(0, 6)}`,
      published,
    })
    return NextResponse.json({ id, published, sellerCents: assessment.sellerCents })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not add listing' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as {
    listingId?: string
    priceCents?: number
    published?: boolean
    title?: string
  } | null
  if (!body?.listingId) return NextResponse.json({ error: 'Listing is required.' }, { status: 400 })
  const listings = await listSellerListings(user.id)
  const listing = listings.find(item => item.id === body.listingId)
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  const priceCents = body.priceCents ?? listing.priceCents
  const assessment = assessListingPrice({
    priceCents,
    costCents: listing.costCents,
    shippingCents: listing.shippingCents,
    platformFeeBps: platformFeeBps(),
    settlement: settlementFor(listing.provider),
    destinationAccountId: listing.supplierAccountId,
  })
  if (!assessment.ok) {
    return NextResponse.json({ error: assessment.reason || 'Price does not cover supplier cost and fees.' }, { status: 400 })
  }
  const profile = await getStoreProfile(user.id)
  let published = body.published
  if (published) {
    if (profile?.connectTransfersStatus !== 'active' || !profile.storePublished) {
      return NextResponse.json({ error: 'Publish the storefront and connect payouts before listing products.' }, { status: 409 })
    }
    if (listing.provider === 'direct' && listing.supplierTransfersStatus !== 'active') {
      return NextResponse.json({ error: 'This direct supplier has not finished payout setup.' }, { status: 409 })
    }
  }
  await updateListing({
    sellerUserId: user.id,
    listingId: listing.id,
    priceCents,
    title: body.title?.trim(),
    published,
  })
  return NextResponse.json({ ok: true, sellerCents: assessment.sellerCents })
}
