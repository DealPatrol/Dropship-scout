import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getProduct } from '@/lib/merchandising/data'
import { ProductDetailView } from '@/components/merchandising/product-detail-view'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({
  params,
}: {
  params: { productId: string }
}) {
  const product = getProduct(params.productId)
  if (!product) notFound()

  const user = await getSession()
  return <ProductDetailView product={product} userId={user?.id ?? ''} />
}
