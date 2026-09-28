import { describe, expect, it } from 'vitest'
import {
  buildCjOrderPayload,
  buildPrintfulOrderPayload,
  buildPrintifyOrderPayload,
} from '@/lib/commerce/payloads'
import { isSellableProvider, settlementFor } from '@/lib/commerce/types'
import type { ShippingAddress } from '@/lib/commerce/types'

const recipient: ShippingAddress = {
  name: 'Ada Buyer',
  email: 'ada@example.com',
  phone: '4155550100',
  address1: '1 Market St',
  city: 'San Francisco',
  province: 'CA',
  countryCode: 'US',
  country: 'United States',
  zip: '94105',
}

describe('supplier order payloads', () => {
  it('creates a CJ sandbox order that does not pay the CJ balance', () => {
    const payload = buildCjOrderPayload({
      orderNumber: 'order-1',
      mode: 'sandbox',
      recipient,
      logisticName: 'CJPacket Ordinary',
      items: [{ vid: 'vid-1', quantity: 2, storeLineItemId: 'line-1' }],
    })

    expect(payload.isSandbox).toBe(1)
    expect(payload.payType).toBe(3)
    expect(payload.products).toEqual([{ vid: 'vid-1', quantity: 2, storeLineItemId: 'line-1' }])
    expect(payload.shippingCountryCode).toBe('US')
  })

  it('pays CJ from the platform balance only in live mode', () => {
    const payload = buildCjOrderPayload({
      orderNumber: 'order-1',
      mode: 'live',
      recipient,
      logisticName: 'PostNL',
      items: [{ vid: 'vid-1', quantity: 1, storeLineItemId: 'line-1' }],
    })

    expect(payload.isSandbox).toBe(0)
    expect(payload.payType).toBe(2)
  })

  it('creates an unconfirmed Printful draft unless live mode is on', () => {
    const draft = buildPrintfulOrderPayload({
      orderNumber: 'order-1',
      mode: 'sandbox',
      recipient,
      items: [{ syncVariantId: 4012, quantity: 1 }],
    })
    const live = buildPrintfulOrderPayload({
      orderNumber: 'order-1',
      mode: 'live',
      recipient,
      items: [{ syncVariantId: 4012, quantity: 1 }],
    })

    expect(draft.confirm).toBe(false)
    expect(live.confirm).toBe(true)
    expect(draft.items).toEqual([{ sync_variant_id: 4012, quantity: 1 }])
  })

  it('builds a Printify order that is not sent to production by itself', () => {
    const payload = buildPrintifyOrderPayload({
      orderNumber: 'order-1',
      recipient,
      shippingMethod: 1,
      items: [{ productId: 'prod-1', variantId: 99, quantity: 1 }],
    })

    expect(payload).not.toHaveProperty('send_to_production')
    expect(payload.line_items).toEqual([{ product_id: 'prod-1', variant_id: 99, quantity: 1 }])
    expect(payload.address_to.country).toBe('US')
  })
})

describe('sellable providers', () => {
  it('does not treat the demo catalog as a supplier that can be sold', () => {
    expect(isSellableProvider('demo')).toBe(false)
    expect(isSellableProvider('cj')).toBe(true)
    expect(settlementFor('printful')).toBe('platform_invoice')
    expect(settlementFor('direct')).toBe('connected_account')
  })
})
