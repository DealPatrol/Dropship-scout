import { estimateStripeFeeCents, isCents } from '@/lib/commerce/money'
import { calculatePayoutSplit } from '@/lib/commerce/payout-split'
import { settlementFor, type SellableProvider, type ShippingAddress } from '@/lib/commerce/types'

export interface ChannelListingMatch {
  id: string
  title: string
  supplierProductId: string
  provider: SellableProvider
  supplierProfileId: string | null
  supplierAccountId: string | null
  costCents: number
  shippingCents: number
  externalProductId: string
  externalVariantId: string
  matchKey: string
}

export interface IncomingChannelLine {
  channelLineId: string
  matchKey: string
  quantity: number
  unitPriceCents: number
  title: string
}

export interface MappedChannelOrder {
  externalOrderId: string
  email: string
  address: ShippingAddress
  merchandiseCents: number
  shippingCents: number
  grossCents: number
  feeCents: number
  lines: {
    listing: ChannelListingMatch
    channelLineId: string
    quantity: number
    unitPriceCents: number
    title: string
  }[]
}

export function mapChannelOrder(input: {
  externalOrderId: string
  currency: string
  email: string
  shippingCents: number
  address: ShippingAddress | null
  lines: IncomingChannelLine[]
  listings: ChannelListingMatch[]
  platformFeeBps: number
}): { ok: true; order: MappedChannelOrder } | { ok: false; reason: string } {
  if (input.currency.toUpperCase() !== 'USD') {
    return { ok: false, reason: 'Only USD channel orders can be imported.' }
  }
  if (!input.address?.address1 || !input.address.city || !input.address.countryCode || !input.address.zip) {
    return { ok: false, reason: 'The channel order is missing a shipping address.' }
  }
  if (input.lines.length === 0) {
    return { ok: false, reason: 'The channel order has no line items.' }
  }
  if (!isCents(input.shippingCents)) {
    return { ok: false, reason: 'Shipping amount is invalid.' }
  }

  const byKey = new Map(input.listings.map(listing => [listing.matchKey, listing]))
  const lines: MappedChannelOrder['lines'] = []
  for (const line of input.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) {
      return { ok: false, reason: `${line.title} has a quantity this app cannot fulfill.` }
    }
    if (!isCents(line.unitPriceCents) || line.unitPriceCents <= 0) {
      return { ok: false, reason: `${line.title} has an invalid price.` }
    }
    const listing = byKey.get(line.matchKey)
    if (!listing) {
      return { ok: false, reason: `${line.title} is not a published Dropship Scout product on this channel.` }
    }
    lines.push({
      listing,
      channelLineId: line.channelLineId,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      title: line.title,
    })
  }

  const merchandiseCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  const grossCents = merchandiseCents + input.shippingCents
  const feeCents = estimateStripeFeeCents(grossCents)
  const split = calculatePayoutSplit({
    grossCents,
    merchandiseCents,
    stripeFeeCents: feeCents,
    platformFeeBps: input.platformFeeBps,
    suppliers: lines.map(line => ({
      id: line.listing.provider === 'direct' ? `direct:${line.listing.supplierProfileId}` : line.listing.provider,
      settlement: settlementFor(line.listing.provider),
      costCents: (line.listing.costCents + line.listing.shippingCents) * line.quantity,
      destinationAccountId: line.listing.supplierAccountId,
    })),
  })
  if (!split.viable) {
    return { ok: false, reason: split.reason ?? 'This order does not cover supplier cost and fees.' }
  }

  return {
    ok: true,
    order: {
      externalOrderId: input.externalOrderId,
      email: input.email,
      address: { ...input.address, email: input.address.email || input.email },
      merchandiseCents,
      shippingCents: input.shippingCents,
      grossCents,
      feeCents,
      lines,
    },
  }
}
