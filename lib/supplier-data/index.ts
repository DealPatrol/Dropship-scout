import { CjDropshippingAdapter } from './cj-adapter'
import { DemoSupplierAdapter } from './demo-adapter'
import type { SupplierDataAdapter, SupplierSource, SupplierSourceId } from './types'

export type {
  SupplierDataAdapter,
  SupplierProductResult,
  SupplierProductSearch,
  SupplierSource,
  SupplierSourceId,
} from './types'

export function getSupplierAdapter(sourceId: SupplierSourceId): SupplierDataAdapter {
  switch (sourceId) {
    case 'demo':
      return new DemoSupplierAdapter()
    case 'cj':
      return new CjDropshippingAdapter()
    default: {
      const exhaustive: never = sourceId
      throw new Error(`Unsupported supplier source: ${exhaustive}`)
    }
  }
}

export function listSupplierSources(): SupplierSource[] {
  return [
    new DemoSupplierAdapter().source,
    new CjDropshippingAdapter().source,
  ]
}
