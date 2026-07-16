import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { OrderDetailView } from '@/components/dashboard/order-detail-view'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/login')

  const orderId = parseInt(params.id, 10)
  if (isNaN(orderId)) {
    redirect('/dashboard/orders')
  }

  return <OrderDetailView orderId={orderId} />
}
