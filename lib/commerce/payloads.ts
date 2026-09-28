import type { OrdersMode } from './modes'
import type { ShippingAddress } from './types'

export interface CjOrderItem {
  vid: string
  quantity: number
  storeLineItemId: string
}

export interface CjOrderPayloadInput {
  orderNumber: string
  mode: OrdersMode
  recipient: ShippingAddress
  items: CjOrderItem[]
  logisticName: string
}

export function buildCjOrderPayload(input: CjOrderPayloadInput) {
  return {
    orderNumber: input.orderNumber.slice(0, 50),
    shippingZip: input.recipient.zip,
    shippingCountryCode: input.recipient.countryCode,
    shippingCountry: input.recipient.country,
    shippingProvince: input.recipient.province || input.recipient.city,
    shippingCity: input.recipient.city,
    shippingPhone: input.recipient.phone ?? '',
    shippingCustomerName: input.recipient.name.slice(0, 50),
    shippingAddress: input.recipient.address1,
    shippingAddress2: input.recipient.address2 ?? '',
    email: input.recipient.email,
    remark: 'Dropship Scout',
    logisticName: input.logisticName,
    fromCountryCode: 'CN',
    platform: 'Api',
    shopLogisticsType: 2,
    orderFlow: 1,
    payType: input.mode === 'live' ? 2 : 3,
    isSandbox: input.mode === 'sandbox' ? 1 : 0,
    products: input.items.map(item => ({
      vid: item.vid,
      quantity: item.quantity,
      storeLineItemId: item.storeLineItemId,
    })),
  }
}

export interface PrintfulOrderItem {
  syncVariantId: number
  quantity: number
}

export function buildPrintfulOrderPayload(input: {
  orderNumber: string
  mode: OrdersMode
  recipient: ShippingAddress
  items: PrintfulOrderItem[]
}) {
  return {
    external_id: input.orderNumber,
    confirm: input.mode === 'live',
    recipient: {
      name: input.recipient.name,
      address1: input.recipient.address1,
      address2: input.recipient.address2 ?? '',
      city: input.recipient.city,
      state_code: input.recipient.province,
      country_code: input.recipient.countryCode,
      zip: input.recipient.zip,
      email: input.recipient.email,
      phone: input.recipient.phone ?? '',
    },
    items: input.items.map(item => ({
      sync_variant_id: item.syncVariantId,
      quantity: item.quantity,
    })),
  }
}

export interface PrintifyOrderItem {
  productId: string
  variantId: number
  quantity: number
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  return {
    firstName: parts[0] || 'Customer',
    lastName: parts.slice(1).join(' ') || 'Customer',
  }
}

export function buildPrintifyOrderPayload(input: {
  orderNumber: string
  recipient: ShippingAddress
  items: PrintifyOrderItem[]
  shippingMethod: number
}) {
  const name = splitName(input.recipient.name)
  return {
    external_id: input.orderNumber,
    label: input.orderNumber,
    line_items: input.items.map(item => ({
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
    shipping_method: input.shippingMethod,
    send_shipping_notification: false,
    address_to: {
      first_name: name.firstName,
      last_name: name.lastName,
      email: input.recipient.email,
      phone: input.recipient.phone ?? '0000000000',
      country: input.recipient.countryCode,
      region: input.recipient.province,
      address1: input.recipient.address1,
      address2: input.recipient.address2 ?? '',
      city: input.recipient.city,
      zip: input.recipient.zip,
    },
  }
}
