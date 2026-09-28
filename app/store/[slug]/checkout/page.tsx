import { StoreFrame } from '@/components/storefront/store-frame'
import { CartView } from '@/components/storefront/cart-view'

export const dynamic = 'force-dynamic'

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  return (
    <StoreFrame name="Checkout" slug={params.slug}>
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      <CartView slug={params.slug} checkout />
    </StoreFrame>
  )
}
