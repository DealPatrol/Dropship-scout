import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { OrdersView } from '@/components/dashboard/orders-view'

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/login')

  return <OrdersView />
}
