import { getSession } from '@/lib/auth'
import { CatalogView } from '@/components/merchandising/catalog-view'

export default async function CatalogPage() {
  const user = await getSession()
  return <CatalogView userId={user?.id ?? ''} />
}
