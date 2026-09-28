import { NextRequest, NextResponse } from 'next/server'
import { assessListingPrice } from '@/lib/commerce/listing-price'
import { assertCommercePaymentsAllowed, platformFeeBps } from '@/lib/commerce/modes'
import { estimateStripeFeeCents } from '@/lib/commerce/money'
import { calculatePayoutSplit } from '@/lib/commerce/payout-split'
import { settlementFor } from '@/lib/commerce/types'
import { env } from '@/lib/env'
import { checkoutIntegrationIdentifier, getStripe } from '@/lib/stripe'
import { attachCheckoutSession, createPendingOrder, getPublishedStore } from '@/lib/store-db'

interface CheckoutLine {
  listingId?: string
  quantity?: number
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(() => null) as { lines?: CheckoutLine[] } | null
  const lines = body?.lines ?? []
  if (lines.length === 0 || lines.length > 20) {
    return NextResponse.json({ error: 'Add between 1 and 20 products.' }, { status: 400 })
  }
  const store = await getPublishedStore(params.slug)
  if (!store?.payoutsReady) {
    return NextResponse.json({ error: 'This store is not ready to take payments.' }, { status: 409 })
  }

  const selected = []
  for (const line of lines) {
    const quantity = line.quantity ?? 0
    const listing = store.listings.find(item => item.id === line.listingId)
    if (!listing || quantity < 1 || quantity > 20) {
      return NextResponse.json({ error: 'A cart item is invalid.' }, { status: 400 })
    }
    if (listing.provider === 'direct' && listing.supplierTransfersStatus !== 'active') {
      return NextResponse.json({ error: `${listing.title} cannot be fulfilled right now.` }, { status: 409 })
    }
    const unit = assessListingPrice({
      priceCents: listing.priceCents,
      costCents: listing.costCents,
      shippingCents: listing.shippingCents,
      platformFeeBps: platformFeeBps(),
      settlement: settlementFor(listing.provider),
      destinationAccountId: listing.supplierAccountId,
    })
    if (!unit.ok) {
      return NextResponse.json({ error: `${listing.title} is priced below supplier cost.` }, { status: 400 })
    }
    selected.push({ listing, quantity })
  }

  const merchandiseCents = selected.reduce((sum, line) => sum + line.listing.priceCents * line.quantity, 0)
  const shippingCents = selected.reduce((sum, line) => sum + line.listing.shippingCents * line.quantity, 0)
  const grossCents = merchandiseCents + shippingCents
  const preview = calculatePayoutSplit({
    grossCents,
    merchandiseCents,
    stripeFeeCents: estimateStripeFeeCents(grossCents),
    platformFeeBps: platformFeeBps(),
    suppliers: selected.map(line => ({
      id: line.listing.provider === 'direct' ? `direct:${line.listing.supplierProfileId}` : line.listing.provider,
      settlement: settlementFor(line.listing.provider),
      costCents: (line.listing.costCents + line.listing.shippingCents) * line.quantity,
      destinationAccountId: line.listing.supplierAccountId,
    })),
  })
  if (!preview.viable) {
    return NextResponse.json({ error: preview.reason || 'This cart cannot be paid out.' }, { status: 400 })
  }

  try {
    assertCommercePaymentsAllowed()
    const order = await createPendingOrder({
      sellerUserId: store.sellerUserId,
      merchandiseCents,
      shippingCents,
      grossCents,
      items: selected.map(line => ({
        listingId: line.listing.id,
        supplierProductId: line.listing.supplierProductId,
        provider: line.listing.provider,
        supplierProfileId: line.listing.supplierProfileId,
        title: line.listing.title,
        quantity: line.quantity,
        unitPriceCents: line.listing.priceCents,
        unitCostCents: line.listing.costCents,
        unitShippingCents: line.listing.shippingCents,
        externalProductId: line.listing.externalProductId,
        externalVariantId: line.listing.externalVariantId,
      })),
    })
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        ...selected.map(line => ({
          quantity: line.quantity,
          price_data: {
            currency: 'usd',
            unit_amount: line.listing.priceCents,
            product_data: {
              name: line.listing.title,
              ...(line.listing.imageUrl?.startsWith('https://') ? { images: [line.listing.imageUrl] } : {}),
            },
          },
        })),
        ...(shippingCents > 0
          ? [{
              quantity: 1,
              price_data: {
                currency: 'usd',
                unit_amount: shippingCents,
                product_data: { name: 'Shipping' },
              },
            }]
          : []),
      ],
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'IE', 'NZ'],
      },
      phone_number_collection: { enabled: true },
      success_url: `${env.appUrl}/store/${store.storeSlug}/orders/${order.publicToken}?paid=1`,
      cancel_url: `${env.appUrl}/store/${store.storeSlug}/cart`,
      metadata: {
        kind: 'storefront',
        orderId: order.id,
        sellerUserId: store.sellerUserId,
      },
      payment_intent_data: {
        metadata: { kind: 'storefront', orderId: order.id },
        transfer_group: order.id,
      },
      integration_identifier: checkoutIntegrationIdentifier(store.sellerUserId),
    }, {
      idempotencyKey: `store-checkout-${order.id}`,
    })
    await attachCheckoutSession(order.id, session.id)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start checkout' },
      { status: 500 }
    )
  }
}
