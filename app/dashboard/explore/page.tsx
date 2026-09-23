import { getSession } from '@/lib/auth'
import { ExplorerView } from '@/components/merchandising/explorer-view'

export default async function ExplorePage() {
  const user = await getSession()
  return <ExplorerView userId={user?.id ?? ''} />
}
