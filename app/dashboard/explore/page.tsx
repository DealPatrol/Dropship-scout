import { createClient } from '@/lib/supabase/server'
import { ExplorerView } from '@/components/merchandising/explorer-view'

export default async function ExplorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <ExplorerView userId={user?.id ?? ''} />
}
