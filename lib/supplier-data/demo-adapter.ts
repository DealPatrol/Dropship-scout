import { PRODUCTS } from '@/lib/merchandising/data'
import type {
  SupplierDataAdapter,
  SupplierProductResult,
  SupplierProductSearch,
} from './types'

export class DemoSupplierAdapter implements SupplierDataAdapter {
  readonly source = {
    id: 'demo' as const,
    label: 'Built-in demo catalog',
    kind: 'demo' as const,
    configured: true,
    description: 'Curated sample data for evaluating Dropship Scout; prices and demand are not live.',
  }

  async search(input: SupplierProductSearch): Promise<SupplierProductResult> {
    const query = input.query?.trim().toLowerCase() ?? ''
    const page = Math.max(input.page ?? 1, 1)
    const pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100)
    const matches = query
      ? PRODUCTS.filter(product =>
          [product.name, product.audience, ...product.tags].some(value =>
            value.toLowerCase().includes(query)
          )
        )
      : PRODUCTS
    const offset = (page - 1) * pageSize

    return {
      source: this.source.id,
      products: matches.slice(offset, offset + pageSize),
      total: matches.length,
    }
  }
}
