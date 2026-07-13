import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { SavedProductsView } from '@/components/dashboard/saved-products-view'

export default async function SavedProductsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/auth/login')
  }

  return <SavedProductsView />
}
