import { describe, expect, it } from 'vitest'
import { assessListingPrice } from '@/lib/commerce/listing-price'
import { calculatePayoutSplit } from '@/lib/commerce/payout-split'

const base = {
  grossCents: 10_000,
  merchandiseCents: 8_000,
  stripeFeeCents: 320,
  platformFeeBps: 500,
}

describe('calculatePayoutSplit', () => {
  it('keeps API supplier cost on the platform and transfers the seller the remainder', () => {
    const split = calculatePayoutSplit({
      ...base,
      suppliers: [{ id: 'cj', settlement: 'platform_invoice', costCents: 5_000 }],
    })

    expect(split.viable).toBe(true)
    expect(split.platformFeeCents).toBe(400)
    expect(split.sellerTransferCents).toBe(4_280)
    expect(split.supplierTransfers).toEqual([])
    expect(split.supplierPayables).toEqual([{ id: 'cj', amountCents: 5_000 }])
    expect(split.platformRetainedCents).toBe(5_400)
    expect(
      split.sellerTransferCents + split.platformRetainedCents + split.stripeFeeCents
    ).toBe(split.grossCents)
  })

  it('transfers a direct supplier its cost and the seller the remainder', () => {
    const split = calculatePayoutSplit({
      ...base,
      suppliers: [
        {
          id: 'direct-1',
          settlement: 'connected_account',
          costCents: 5_000,
          destinationAccountId: 'acct_supplier',
        },
      ],
    })

    expect(split.viable).toBe(true)
    expect(split.supplierTransfers).toEqual([
      { id: 'direct-1', amountCents: 5_000, destinationAccountId: 'acct_supplier' },
    ])
    expect(split.supplierPayables).toEqual([])
    expect(split.sellerTransferCents).toBe(4_280)
    expect(split.platformRetainedCents).toBe(400)
    expect(
      split.sellerTransferCents +
        5_000 +
        split.platformRetainedCents +
        split.stripeFeeCents
    ).toBe(split.grossCents)
  })

  it('splits one charge across an API supplier and a direct supplier', () => {
    const split = calculatePayoutSplit({
      ...base,
      suppliers: [
        { id: 'cj', settlement: 'platform_invoice', costCents: 2_000 },
        {
          id: 'direct-1',
          settlement: 'connected_account',
          costCents: 3_000,
          destinationAccountId: 'acct_supplier',
        },
      ],
    })

    expect(split.viable).toBe(true)
    expect(split.sellerTransferCents).toBe(4_280)
    expect(split.supplierTransfers).toEqual([
      { id: 'direct-1', amountCents: 3_000, destinationAccountId: 'acct_supplier' },
    ])
    expect(split.supplierPayables).toEqual([{ id: 'cj', amountCents: 2_000 }])
    expect(split.platformRetainedCents).toBe(2_400)
  })

  it('refuses a split that would pay the seller a negative amount', () => {
    const split = calculatePayoutSplit({
      ...base,
      suppliers: [{ id: 'cj', settlement: 'platform_invoice', costCents: 9_500 }],
    })

    expect(split.viable).toBe(false)
    expect(split.sellerTransferCents).toBeLessThan(0)
    expect(split.supplierTransfers).toEqual([])
    expect(split.reason).toMatch(/negative/i)
  })

  it('refuses a direct supplier with no connected account', () => {
    const split = calculatePayoutSplit({
      ...base,
      suppliers: [{ id: 'direct-1', settlement: 'connected_account', costCents: 5_000 }],
    })

    expect(split.viable).toBe(false)
    expect(split.reason).toMatch(/Stripe account/i)
  })
})

describe('assessListingPrice', () => {
  it('rejects a retail price that cannot clear supplier cost and fees', () => {
    const assessment = assessListingPrice({
      priceCents: 1_000,
      costCents: 900,
      shippingCents: 400,
      platformFeeBps: 500,
      settlement: 'platform_invoice',
    })

    expect(assessment.ok).toBe(false)
  })

  it('accepts a retail price that leaves the seller a remainder', () => {
    const assessment = assessListingPrice({
      priceCents: 4_000,
      costCents: 1_200,
      shippingCents: 500,
      platformFeeBps: 500,
      settlement: 'platform_invoice',
    })

    expect(assessment.ok).toBe(true)
    expect(assessment.sellerCents).toBeGreaterThan(0)
  })
})
