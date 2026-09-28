import type { PlaceOrderResult, RouteGroup, RouteOrderInput } from '@/lib/commerce/order-routing'
import type { SellableProvider } from '@/lib/commerce/types'

export interface ImportedVariant {
  provider: SellableProvider
  externalId: string
  variantId: string
  title: string
  description: string
  imageUrl?: string
  costCents: number
  shippingCents: number
  sku?: string
  stock: number | null
  available: boolean
}

export interface SupplierGateway {
  provider: SellableProvider
  configured(): boolean
  missingConfiguration(): string
  search(query: string): Promise<ImportedVariant[]>
  placeOrder(group: RouteGroup, input: RouteOrderInput): Promise<PlaceOrderResult>
  cancelOrder(group: RouteGroup, externalOrderId: string): Promise<void>
  tracking(externalOrderId: string): Promise<{
    trackingNumber?: string
    trackingUrl?: string
    carrier?: string
  } | null>
}
