import { OrdersView } from '@/components/dashboard/orders-view'
import { getSession } from '@/lib/auth'
import { getStoreProfile } from '@/lib/store-db'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const user = await getSession()
  if (!user) redirect('/auth/login')
  const profile = await getStoreProfile(user.id)
  return <OrdersView storeSlug={profile?.storeSlug ?? null} />
}
