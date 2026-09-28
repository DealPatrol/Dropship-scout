import { estimateStripeFeeCents } from './money'
import { calculatePayoutSplit } from './payout-split'
import type { SupplierSettlement } from './types'

export function assessListingPrice(input: {
  priceCents: number
  costCents: number
  shippingCents: number
  platformFeeBps: number
  settlement: SupplierSettlement
  destinationAccountId?: string | null
}): { ok: boolean; reason?: string; sellerCents: number; platformFeeCents: number } {
  const grossCents = input.priceCents + input.shippingCents
  const split = calculatePayoutSplit({
    grossCents,
    merchandiseCents: input.priceCents,
    stripeFeeCents: estimateStripeFeeCents(grossCents),
    platformFeeBps: input.platformFeeBps,
    suppliers: [
      {
        id: 'listing',
        settlement: input.settlement,
        costCents: input.costCents + input.shippingCents,
        destinationAccountId: input.destinationAccountId,
      },
    ],
  })
  return {
    ok: split.viable,
    reason: split.reason,
    sellerCents: split.sellerTransferCents,
    platformFeeCents: split.platformFeeCents,
  }
}
