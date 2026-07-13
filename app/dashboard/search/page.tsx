import { getSession } from '@/lib/auth'
import { SearchView } from '@/components/dashboard/search-view'

export default async function SearchPage() {
  const user = await getSession()
  return <SearchView userId={user?.id ?? ''} />
}
