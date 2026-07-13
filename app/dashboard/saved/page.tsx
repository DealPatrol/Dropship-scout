import { getSession } from '@/lib/auth'
import { SavedProductsView } from '@/components/dashboard/saved-products-view'

export default async function SavedProductsPage() {
  const user = await getSession()
  return <SavedProductsView userId={user?.id ?? ''} />
}
