import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <ProductDetailView product={product} userId={user?.id ?? ''} />
}
