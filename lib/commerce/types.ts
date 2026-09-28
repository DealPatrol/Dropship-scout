export const SELLABLE_PROVIDERS = ['cj', 'printful', 'printify', 'direct'] as const

export type SellableProvider = (typeof SELLABLE_PROVIDERS)[number]

export type SupplierSettlement = 'connected_account' | 'platform_invoice'

export interface ShippingAddress {
  name: string
  email: string
  phone?: string
  address1: string
  address2?: string
  city: string
  province: string
  countryCode: string
  country: string
  zip: string
}

export function isSellableProvider(value: string): value is SellableProvider {
  return (SELLABLE_PROVIDERS as readonly string[]).includes(value)
}

export function settlementFor(provider: SellableProvider): SupplierSettlement {
  switch (provider) {
    case 'cj':
    case 'printful':
    case 'printify':
      return 'platform_invoice'
    case 'direct':
      return 'connected_account'
    default: {
      const exhaustive: never = provider
      throw new Error(`Unsupported supplier provider: ${exhaustive}`)
    }
  }
}
