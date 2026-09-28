import { isCents } from './money'

export type SupplierSettlement = 'connected_account' | 'platform_invoice'

export interface SupplierObligation {
  id: string
  settlement: SupplierSettlement
  costCents: number
  destinationAccountId?: string | null
}

export interface PayoutSplitInput {
  grossCents: number
  merchandiseCents: number
  stripeFeeCents: number
  platformFeeBps: number
  suppliers: SupplierObligation[]
}

export interface SupplierTransferLine {
  id: string
  amountCents: number
  destinationAccountId: string
}

export interface SupplierPayableLine {
  id: string
  amountCents: number
}

export interface PayoutSplit {
  grossCents: number
  merchandiseCents: number
  stripeFeeCents: number
  supplierCostCents: number
  platformFeeCents: number
  sellerTransferCents: number
  supplierTransfers: SupplierTransferLine[]
  supplierPayables: SupplierPayableLine[]
  platformRetainedCents: number
  viable: boolean
  reason?: string
}

function emptySplit(input: PayoutSplitInput, reason: string): PayoutSplit {
  return {
    grossCents: input.grossCents,
    merchandiseCents: input.merchandiseCents,
    stripeFeeCents: input.stripeFeeCents,
    supplierCostCents: 0,
    platformFeeCents: 0,
    sellerTransferCents: 0,
    supplierTransfers: [],
    supplierPayables: [],
    platformRetainedCents: 0,
    viable: false,
    reason,
  }
}

/**
 * Separate charges and transfers.
 * The platform fee is a share of merchandise (not shipping).
 * API suppliers are paid by the platform from the charge, so their cost stays
 * on the platform balance. Direct suppliers are paid with a Connect transfer.
 * The seller transfer is whatever remains after Stripe fees, supplier cost,
 * and the platform fee.
 */
export function calculatePayoutSplit(input: PayoutSplitInput): PayoutSplit {
  if (!isCents(input.grossCents) || input.grossCents <= 0) {
    return emptySplit(input, 'Charge amount must be a positive number of cents.')
  }
  if (!isCents(input.merchandiseCents) || input.merchandiseCents > input.grossCents) {
    return emptySplit(input, 'Merchandise amount is invalid.')
  }
  if (!isCents(input.stripeFeeCents) || input.stripeFeeCents >= input.grossCents) {
    return emptySplit(input, 'Stripe fee is invalid for this charge.')
  }
  if (!Number.isInteger(input.platformFeeBps) || input.platformFeeBps < 0 || input.platformFeeBps > 10_000) {
    return emptySplit(input, 'Platform fee must be between 0 and 10000 basis points.')
  }
  if (input.suppliers.length === 0) {
    return emptySplit(input, 'Order has no supplier to pay.')
  }

  for (const supplier of input.suppliers) {
    if (!isCents(supplier.costCents)) {
      return emptySplit(input, 'Supplier cost must be a non-negative number of cents.')
    }
  }

  const supplierCostCents = input.suppliers.reduce((sum, supplier) => sum + supplier.costCents, 0)
  const platformFeeCents = Math.round((input.merchandiseCents * input.platformFeeBps) / 10_000)
  const sellerTransferCents = input.grossCents - input.stripeFeeCents - supplierCostCents - platformFeeCents
  const supplierTransfers: SupplierTransferLine[] = []
  const supplierPayables: SupplierPayableLine[] = []

  for (const supplier of input.suppliers) {
    if (supplier.costCents === 0) continue
    if (supplier.settlement === 'connected_account') {
      if (!supplier.destinationAccountId) {
        return emptySplit(input, 'Direct supplier is missing a Stripe account that can receive transfers.')
      }
      supplierTransfers.push({
        id: supplier.id,
        amountCents: supplier.costCents,
        destinationAccountId: supplier.destinationAccountId,
      })
    } else {
      supplierPayables.push({ id: supplier.id, amountCents: supplier.costCents })
    }
  }

  const transferredToSuppliers = supplierTransfers.reduce((sum, line) => sum + line.amountCents, 0)
  const platformRetainedCents = input.grossCents - input.stripeFeeCents - sellerTransferCents - transferredToSuppliers

  if (sellerTransferCents < 0) {
    return {
      grossCents: input.grossCents,
      merchandiseCents: input.merchandiseCents,
      stripeFeeCents: input.stripeFeeCents,
      supplierCostCents,
      platformFeeCents,
      sellerTransferCents,
      supplierTransfers: [],
      supplierPayables: [],
      platformRetainedCents,
      viable: false,
      reason: 'Seller payout would be negative after supplier cost, Stripe fees, and the platform fee.',
    }
  }

  return {
    grossCents: input.grossCents,
    merchandiseCents: input.merchandiseCents,
    stripeFeeCents: input.stripeFeeCents,
    supplierCostCents,
    platformFeeCents,
    sellerTransferCents,
    supplierTransfers,
    supplierPayables,
    platformRetainedCents,
    viable: true,
  }
}
