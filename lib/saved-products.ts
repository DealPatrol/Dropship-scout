import type { Product } from './types'

export function validateSavedProduct(value: unknown): Product {
  if (!value || typeof value !== 'object') {
    throw new Error('product must be an object')
  }

  const product = value as Partial<Product>
  if (!product.name?.trim()) throw new Error('product.name is required')
  if (!product.category?.trim()) throw new Error('product.category is required')
  if (!Number.isFinite(Number(product.sellPrice)) || Number(product.sellPrice) < 0) {
    throw new Error('product.sellPrice must be a non-negative number')
  }
  if (!Number.isFinite(Number(product.sourcePrice)) || Number(product.sourcePrice) < 0) {
    throw new Error('product.sourcePrice must be a non-negative number')
  }
  if (!Array.isArray(product.platforms) || !Array.isArray(product.tags)) {
    throw new Error('product platforms and tags must be arrays')
  }

  return product as Product
}
