import { StoreFrame } from '@/components/storefront/store-frame'
import { CartView } from '@/components/storefront/cart-view'

export const dynamic = 'force-dynamic'

export default function CartPage({ params }: { params: { slug: string } }) {
  return (
    <StoreFrame name="Cart" slug={params.slug}>
      <h1 className="text-2xl font-semibold mb-6">Cart</h1>
      <CartView slug={params.slug} />
    </StoreFrame>
  )
}
