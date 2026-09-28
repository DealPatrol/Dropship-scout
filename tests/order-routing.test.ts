import { describe, expect, it } from 'vitest'
import {
  compensateAfterRefund,
  routePaidOrder,
  type PaymentPort,
  type PlaceOrderResult,
  type RouteOrderInput,
  type SupplierPort,
} from '@/lib/commerce/order-routing'
import type { ShippingAddress } from '@/lib/commerce/types'

const address: ShippingAddress = {
  name: 'Ada Buyer',
  email: 'ada@example.com',
  address1: '1 Market St',
  city: 'San Francisco',
  province: 'CA',
  countryCode: 'US',
  country: 'United States',
  zip: '94105',
}

function order(overrides: Partial<RouteOrderInput> = {}): RouteOrderInput {
  return {
    orderId: 'order-1',
    paymentIntentId: 'pi_123',
    chargeId: 'ch_123',
    sellerAccountId: 'acct_seller',
    grossCents: 10_000,
    merchandiseCents: 8_000,
    stripeFeeCents: 320,
    platformFeeBps: 500,
    address,
    groups: [
      {
        id: 'cj',
        orderNumber: 'order-1-cj',
        provider: 'cj',
        settlement: 'platform_invoice',
        costCents: 5_000,
        items: [
          {
            variantId: 'vid-1',
            quantity: 1,
            storeLineItemId: 'line-1',
            title: 'Bottle',
          },
        ],
      },
    ],
    ...overrides,
  }
}

function ports(place: (groupId: string) => PlaceOrderResult | Promise<PlaceOrderResult>) {
  const calls = {
    placed: [] as string[],
    cancelled: [] as string[],
    refunds: [] as string[],
    transfers: [] as { destination: string; amount: number; key: string }[],
    reversals: [] as string[],
  }
  let transferCount = 0
  const suppliers: SupplierPort = {
    async placeOrder(group) {
      calls.placed.push(group.id)
      return place(group.id)
    },
    async cancelOrder(_group, externalOrderId) {
      calls.cancelled.push(externalOrderId)
    },
  }
  const payments: PaymentPort = {
    async refund(input) {
      calls.refunds.push(input.idempotencyKey)
    },
    async transfer(input) {
      calls.transfers.push({
        destination: input.destinationAccountId,
        amount: input.amountCents,
        key: input.idempotencyKey,
      })
      transferCount += 1
      return { id: `tr_${transferCount}` }
    },
    async reverseTransfer(input) {
      calls.reversals.push(input.transferId)
      return { id: `trr_${input.transferId}` }
    },
  }
  return { ports: { suppliers, payments }, calls }
}

describe('routePaidOrder', () => {
  it('places an API supplier order and transfers only the seller remainder', async () => {
    const { ports: adapters, calls } = ports(() => ({
      status: 'accepted',
      externalOrderId: 'cj-100',
      sandbox: true,
    }))

    const result = await routePaidOrder(order(), adapters)

    expect(result.status).toBe('fulfilled')
    if (result.status !== 'fulfilled') return
    expect(result.split.sellerTransferCents).toBe(4_280)
    expect(result.split.supplierPayables).toEqual([{ id: 'cj', amountCents: 5_000 }])
    expect(calls.transfers).toEqual([
      { destination: 'acct_seller', amount: 4_280, key: 'store-transfer-seller-order-1' },
    ])
    expect(calls.refunds).toEqual([])
    expect(result.fulfillments[0]?.sandbox).toBe(true)
  })

  it('pays a direct supplier and the seller from the same charge', async () => {
    const { ports: adapters, calls } = ports(() => ({
      status: 'accepted',
      externalOrderId: 'direct-9',
      sandbox: true,
    }))

    const result = await routePaidOrder(
      order({
        groups: [
          {
            id: 'direct:sup-1',
            orderNumber: 'order-1-direct',
            provider: 'direct',
            settlement: 'connected_account',
            destinationAccountId: 'acct_supplier',
            costCents: 5_000,
            items: [
              { variantId: 'sku-1', quantity: 2, storeLineItemId: 'line-1', title: 'Mug' },
            ],
          },
        ],
      }),
      adapters
    )

    expect(result.status).toBe('fulfilled')
    expect(calls.transfers).toEqual([
      { destination: 'acct_seller', amount: 4_280, key: 'store-transfer-seller-order-1' },
      {
        destination: 'acct_supplier',
        amount: 5_000,
        key: 'store-transfer-supplier-order-1-direct:sup-1',
      },
    ])
  })

  it('uses the supplier-reported cost when it is higher and still viable', async () => {
    const { ports: adapters, calls } = ports(() => ({
      status: 'accepted',
      externalOrderId: 'cj-100',
      sandbox: false,
      chargedCostCents: 6_000,
    }))

    const result = await routePaidOrder(order(), adapters)

    expect(result.status).toBe('fulfilled')
    if (result.status !== 'fulfilled') return
    expect(result.split.supplierPayables[0]?.amountCents).toBe(6_000)
    expect(result.split.sellerTransferCents).toBe(3_280)
    expect(calls.transfers[0]?.amount).toBe(3_280)
  })

  it('refunds and cancels when the reported supplier cost wipes out the seller', async () => {
    const { ports: adapters, calls } = ports(() => ({
      status: 'accepted',
      externalOrderId: 'cj-100',
      chargedCostCents: 9_500,
    }))

    const result = await routePaidOrder(order(), adapters)

    expect(result.status).toBe('refunded')
    expect(calls.cancelled).toEqual(['cj-100'])
    expect(calls.transfers).toEqual([])
    expect(calls.refunds).toEqual(['store-refund-order-1'])
  })

  it('refunds without placing an order when the catalog split is already impossible', async () => {
    const { ports: adapters, calls } = ports(() => ({
      status: 'accepted',
      externalOrderId: 'should-not-happen',
    }))

    const result = await routePaidOrder(
      order({
        groups: [
          {
            id: 'cj',
            orderNumber: 'order-1-cj',
            provider: 'cj',
            settlement: 'platform_invoice',
            costCents: 9_500,
            items: [],
          },
        ],
      }),
      adapters
    )

    expect(result.status).toBe('refunded')
    expect(calls.placed).toEqual([])
    expect(calls.transfers).toEqual([])
    expect(calls.refunds).toEqual(['store-refund-order-1'])
  })

  it('refunds and cancels an accepted group when a later supplier is out of stock', async () => {
    const { ports: adapters, calls } = ports(groupId => {
      if (groupId === 'cj') return { status: 'accepted', externalOrderId: 'cj-100', sandbox: true }
      return { status: 'rejected', reason: 'Variant is out of stock', outOfStock: true }
    })

    const result = await routePaidOrder(
      order({
        groups: [
          {
            id: 'cj',
            orderNumber: 'order-1-cj',
            provider: 'cj',
            settlement: 'platform_invoice',
            costCents: 2_000,
            items: [],
          },
          {
            id: 'direct:sup-1',
            orderNumber: 'order-1-direct',
            provider: 'direct',
            settlement: 'connected_account',
            destinationAccountId: 'acct_supplier',
            costCents: 3_000,
            items: [],
          },
        ],
      }),
      adapters
    )

    expect(result.status).toBe('refunded')
    if (result.status !== 'refunded') return
    expect(result.outOfStock).toBe(true)
    expect(calls.cancelled).toEqual(['cj-100'])
    expect(calls.transfers).toEqual([])
  })

  it('reverses transfers and refunds the customer when a transfer fails', async () => {
    const { ports: adapters, calls } = ports(() => ({
      status: 'accepted',
      externalOrderId: 'direct-9',
    }))
    const original = adapters.payments.transfer.bind(adapters.payments)
    adapters.payments.transfer = async input => {
      if (input.destinationAccountId === 'acct_supplier') {
        throw new Error('destination account cannot receive transfers')
      }
      return original(input)
    }

    const result = await routePaidOrder(
      order({
        groups: [
          {
            id: 'direct:sup-1',
            orderNumber: 'order-1-direct',
            provider: 'direct',
            settlement: 'connected_account',
            destinationAccountId: 'acct_supplier',
            costCents: 5_000,
            items: [],
          },
        ],
      }),
      adapters
    )

    expect(result.status).toBe('refunded')
    expect(calls.reversals).toEqual(['tr_1'])
    expect(calls.cancelled).toEqual(['direct-9'])
    expect(calls.refunds).toEqual(['store-refund-order-1'])
  })

  it('does not call the supplier when the seller cannot be paid', async () => {
    const { ports: adapters, calls } = ports(() => ({
      status: 'accepted',
      externalOrderId: 'cj-100',
    }))

    const result = await routePaidOrder(order({ sellerAccountId: null }), adapters)

    expect(result.status).toBe('refunded')
    expect(calls.placed).toEqual([])
  })
})

describe('compensateAfterRefund', () => {
  it('reverses seller and supplier transfers and cancels supplier orders', async () => {
    const { ports: adapters, calls } = ports(() => ({ status: 'accepted', externalOrderId: 'unused' }))
    const group = order().groups[0]
    if (!group) throw new Error('missing group')

    const result = await compensateAfterRefund(
      {
        orderId: 'order-1',
        transfers: [
          { stripeTransferId: 'tr_seller', reversed: false },
          { stripeTransferId: 'tr_done', reversed: true },
        ],
        fulfillments: [{ group, externalOrderId: 'cj-100' }],
      },
      adapters
    )

    expect(result.reversals).toEqual([{ transferId: 'tr_seller', reversalId: 'trr_tr_seller' }])
    expect(calls.reversals).toEqual(['tr_seller'])
    expect(calls.cancelled).toEqual(['cj-100'])
  })
})
