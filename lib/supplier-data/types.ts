import type { CatalogProduct } from '@/lib/merchandising/types'

export type SupplierSourceId = 'demo' | 'cj'

export interface SupplierSource {
  id: SupplierSourceId
  label: string
  kind: 'demo' | 'live'
  configured: boolean
  description: string
}

export interface SupplierProductSearch {
  query?: string
  page?: number
  pageSize?: number
}

export interface SupplierProductResult {
  source: SupplierSourceId
  products: CatalogProduct[]
  total: number
}

export interface SupplierDataAdapter {
  readonly source: SupplierSource
  search(input: SupplierProductSearch): Promise<SupplierProductResult>
}
