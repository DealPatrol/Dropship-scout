import type { SellableProvider, ShippingAddress, SupplierSettlement } from './types'
import {
  calculatePayoutSplit,
  type PayoutSplit,
  type SupplierObligation,
} from './payout-split'

export interface RouteGroup {
  id: string
  orderNumber: string
  provider: SellableProvider
  settlement: SupplierSettlement
  destinationAccountId?: string | null
  supplierProfileId?: string | null
  costCents: number
  items: RouteItem[]
}

export interface RouteItem {
  variantId: string
  productId?: string
  supplierProductId?: string
  quantity: number
  storeLineItemId: string
  title: string
}

export type PayoutMode = 'stripe_transfers' | 'channel_collected'

export interface RouteOrderInput {
  orderId: string
  paymentIntentId: string
  chargeId?: string
  sellerAccountId?: string | null
  grossCents: number
  merchandiseCents: number
  stripeFeeCents: number
  platformFeeBps: number
  groups: RouteGroup[]
  address: ShippingAddress
  /**
   * Hosted checkout collects the charge and creates Connect transfers.
   * External channels already collected the customer payment, so the split is
   * recorded and no Stripe transfer is created.
   */
  payoutMode?: PayoutMode
}

export interface PlaceOrderResult {
  status: 'accepted' | 'rejected' | 'error'
  externalOrderId?: string
  reason?: string
  outOfStock?: boolean
  sandbox?: boolean
  chargedCostCents?: number
}

export interface SupplierPort {
  placeOrder(group: RouteGroup, input: RouteOrderInput): Promise<PlaceOrderResult>
  cancelOrder(group: RouteGroup, externalOrderId: string): Promise<void>
}

export interface TransferRequest {
  amountCents: number
  destinationAccountId: string
  chargeId?: string
  transferGroup: string
  idempotencyKey: string
  metadata: Record<string, string>
}

export interface PaymentPort {
  refund(input: { paymentIntentId: string; idempotencyKey: string }): Promise<void>
  transfer(input: TransferRequest): Promise<{ id: string }>
  reverseTransfer(input: { transferId: string; idempotencyKey: string }): Promise<{ id: string }>
}

export interface RoutePorts {
  suppliers: SupplierPort
  payments: PaymentPort
}

export interface RecordedTransfer {
  role: 'seller' | 'supplier'
  groupId?: string
  stripeTransferId: string
  amountCents: number
  destinationAccountId: string
}

export interface RecordedFulfillment {
  groupId: string
  provider: SellableProvider
  externalOrderId: string
  sandbox: boolean
  costCents: number
}

export type RouteResult =
  | {
      status: 'fulfilled'
      split: PayoutSplit
      fulfillments: RecordedFulfillment[]
      transfers: RecordedTransfer[]
      warnings: string[]
    }
  | {
      status: 'refunded'
      reason: string
      outOfStock: boolean
      supplierRejected: boolean
      warnings: string[]
    }
  | {
      status: 'failed'
      reason: string
      warnings: string[]
    }

interface AcceptedOrder {
  group: RouteGroup
  externalOrderId: string
  sandbox: boolean
  costCents: number
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

function obligations(groups: RouteGroup[], costs: Map<string, number>): SupplierObligation[] {
  return groups.map(group => ({
    id: group.id,
    settlement: group.settlement,
    costCents: costs.get(group.id) ?? group.costCents,
    destinationAccountId: group.destinationAccountId,
  }))
}

async function refundCustomer(
  input: RouteOrderInput,
  ports: RoutePorts
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await ports.payments.refund({
      paymentIntentId: input.paymentIntentId,
      idempotencyKey: `store-refund-${input.orderId}`,
    })
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: errorMessage(error) }
  }
}

async function cancelAccepted(
  accepted: AcceptedOrder[],
  ports: RoutePorts,
  warnings: string[]
): Promise<void> {
  for (const entry of accepted) {
    try {
      await ports.suppliers.cancelOrder(entry.group, entry.externalOrderId)
    } catch (error) {
      warnings.push(
        `Could not cancel ${entry.group.provider} order ${entry.externalOrderId}: ${errorMessage(error)}`
      )
    }
  }
}

async function refundAndUnwind(
  input: RouteOrderInput,
  ports: RoutePorts,
  accepted: AcceptedOrder[],
  reason: string,
  flags: { outOfStock: boolean; supplierRejected: boolean },
  warnings: string[]
): Promise<RouteResult> {
  await cancelAccepted(accepted, ports, warnings)
  const refund = await refundCustomer(input, ports)
  if (!refund.ok) {
    return {
      status: 'failed',
      reason: `${reason} Refund also failed: ${refund.reason}`,
      warnings,
    }
  }
  return {
    status: 'refunded',
    reason,
    outOfStock: flags.outOfStock,
    supplierRejected: flags.supplierRejected,
    warnings,
  }
}

function platformCollected(input: RouteOrderInput): boolean {
  return (input.payoutMode ?? 'stripe_transfers') === 'stripe_transfers'
}

export async function routePaidOrder(input: RouteOrderInput, ports: RoutePorts): Promise<RouteResult> {
  const warnings: string[] = []
  const transferOnPlatform = platformCollected(input)
  const catalogCosts = new Map(input.groups.map(group => [group.id, group.costCents]))
  const preview = calculatePayoutSplit({
    grossCents: input.grossCents,
    merchandiseCents: input.merchandiseCents,
    stripeFeeCents: input.stripeFeeCents,
    platformFeeBps: input.platformFeeBps,
    suppliers: obligations(input.groups, catalogCosts),
  })

  if (!preview.viable) {
    return refundAndUnwind(input, ports, [], preview.reason ?? 'Payout split is not viable.', {
      outOfStock: false,
      supplierRejected: false,
    }, warnings)
  }
  if (transferOnPlatform && preview.sellerTransferCents > 0 && !input.sellerAccountId) {
    return refundAndUnwind(input, ports, [], 'Seller payout account is not ready.', {
      outOfStock: false,
      supplierRejected: false,
    }, warnings)
  }

  const accepted: AcceptedOrder[] = []
  const actualCosts = new Map(catalogCosts)

  for (const group of input.groups) {
    let result: PlaceOrderResult
    try {
      result = await ports.suppliers.placeOrder(group, input)
    } catch (error) {
      return refundAndUnwind(
        input,
        ports,
        accepted,
        errorMessage(error),
        { outOfStock: false, supplierRejected: true },
        warnings
      )
    }

    if (result.status !== 'accepted' || !result.externalOrderId) {
      return refundAndUnwind(
        input,
        ports,
        accepted,
        result.reason || 'Supplier rejected the order.',
        { outOfStock: Boolean(result.outOfStock), supplierRejected: true },
        warnings
      )
    }

    const costCents = typeof result.chargedCostCents === 'number' ? result.chargedCostCents : group.costCents
    actualCosts.set(group.id, costCents)
    accepted.push({
      group,
      externalOrderId: result.externalOrderId,
      sandbox: Boolean(result.sandbox),
      costCents,
    })
  }

  const split = calculatePayoutSplit({
    grossCents: input.grossCents,
    merchandiseCents: input.merchandiseCents,
    stripeFeeCents: input.stripeFeeCents,
    platformFeeBps: input.platformFeeBps,
    suppliers: obligations(input.groups, actualCosts),
  })

  if (!split.viable) {
    return refundAndUnwind(
      input,
      ports,
      accepted,
      split.reason ?? 'Supplier cost no longer leaves a seller payout.',
      { outOfStock: false, supplierRejected: true },
      warnings
    )
  }
  if (transferOnPlatform && split.sellerTransferCents > 0 && !input.sellerAccountId) {
    return refundAndUnwind(input, ports, accepted, 'Seller payout account is not ready.', {
      outOfStock: false,
      supplierRejected: false,
    }, warnings)
  }

  const transfers: RecordedTransfer[] = []
  if (!transferOnPlatform) {
    warnings.push('Customer paid on an external channel. The split is recorded and no Stripe transfer is created.')
  }
  try {
    if (transferOnPlatform && split.sellerTransferCents > 0 && input.sellerAccountId) {
      const transfer = await ports.payments.transfer({
        amountCents: split.sellerTransferCents,
        destinationAccountId: input.sellerAccountId,
        chargeId: input.chargeId,
        transferGroup: input.orderId,
        idempotencyKey: `store-transfer-seller-${input.orderId}`,
        metadata: { orderId: input.orderId, role: 'seller' },
      })
      transfers.push({
        role: 'seller',
        stripeTransferId: transfer.id,
        amountCents: split.sellerTransferCents,
        destinationAccountId: input.sellerAccountId,
      })
    }

    for (const line of split.supplierTransfers) {
      const transfer = await ports.payments.transfer({
        amountCents: line.amountCents,
        destinationAccountId: line.destinationAccountId,
        chargeId: input.chargeId,
        transferGroup: input.orderId,
        idempotencyKey: `store-transfer-supplier-${input.orderId}-${line.id}`,
        metadata: { orderId: input.orderId, role: 'supplier', groupId: line.id },
      })
      transfers.push({
        role: 'supplier',
        groupId: line.id,
        stripeTransferId: transfer.id,
        amountCents: line.amountCents,
        destinationAccountId: line.destinationAccountId,
      })
    }
  } catch (error) {
    for (const transfer of transfers) {
      try {
        await ports.payments.reverseTransfer({
          transferId: transfer.stripeTransferId,
          idempotencyKey: `store-reversal-${transfer.stripeTransferId}`,
        })
      } catch (reverseError) {
        warnings.push(
          `Could not reverse transfer ${transfer.stripeTransferId}: ${errorMessage(reverseError)}`
        )
      }
    }
    return refundAndUnwind(
      input,
      ports,
      accepted,
      `Payout transfer failed: ${errorMessage(error)}`,
      { outOfStock: false, supplierRejected: false },
      warnings
    )
  }

  return {
    status: 'fulfilled',
    split,
    fulfillments: accepted.map(entry => ({
      groupId: entry.group.id,
      provider: entry.group.provider,
      externalOrderId: entry.externalOrderId,
      sandbox: entry.sandbox,
      costCents: entry.costCents,
    })),
    transfers,
    warnings,
  }
}

export interface CompensationTransfer {
  stripeTransferId: string
  reversed: boolean
}

export interface CompensationFulfillment {
  group: RouteGroup
  externalOrderId: string
}

export async function compensateAfterRefund(
  input: {
    orderId: string
    transfers: CompensationTransfer[]
    fulfillments: CompensationFulfillment[]
  },
  ports: RoutePorts
): Promise<{ reversals: { transferId: string; reversalId: string }[]; warnings: string[] }> {
  const warnings: string[] = []
  const reversals: { transferId: string; reversalId: string }[] = []

  for (const transfer of input.transfers) {
    if (transfer.reversed) continue
    try {
      const reversal = await ports.payments.reverseTransfer({
        transferId: transfer.stripeTransferId,
        idempotencyKey: `store-reversal-${transfer.stripeTransferId}`,
      })
      reversals.push({ transferId: transfer.stripeTransferId, reversalId: reversal.id })
    } catch (error) {
      warnings.push(`Could not reverse transfer ${transfer.stripeTransferId}: ${errorMessage(error)}`)
    }
  }

  for (const fulfillment of input.fulfillments) {
    try {
      await ports.suppliers.cancelOrder(fulfillment.group, fulfillment.externalOrderId)
    } catch (error) {
      warnings.push(
        `Could not cancel ${fulfillment.group.provider} order ${fulfillment.externalOrderId}: ${errorMessage(error)}`
      )
    }
  }

  return { reversals, warnings }
}
