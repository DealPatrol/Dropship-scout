import type { SellableProvider } from '@/lib/commerce/types'
import { createCjGateway } from './cj'
import { createPrintfulGateway } from './printful'
import { createPrintifyGateway } from './printify'
import type { SupplierGateway } from './types'

export type { ImportedVariant, SupplierGateway } from './types'

const gateways: Record<Exclude<SellableProvider, 'direct'>, () => SupplierGateway> = {
  cj: () => createCjGateway(),
  printful: () => createPrintfulGateway(),
  printify: () => createPrintifyGateway(),
}

export function supplierGateway(provider: Exclude<SellableProvider, 'direct'>): SupplierGateway {
  switch (provider) {
    case 'cj':
      return gateways.cj()
    case 'printful':
      return gateways.printful()
    case 'printify':
      return gateways.printify()
    default: {
      const exhaustive: never = provider
      throw new Error(`Unsupported API supplier: ${exhaustive}`)
    }
  }
}

export function listApiSuppliers(): { provider: Exclude<SellableProvider, 'direct'>; configured: boolean; detail: string }[] {
  return (['cj', 'printful', 'printify'] as const).map(provider => {
    const gateway = supplierGateway(provider)
    return {
      provider,
      configured: gateway.configured(),
      detail: gateway.configured() ? 'Connected' : gateway.missingConfiguration(),
    }
  })
}
