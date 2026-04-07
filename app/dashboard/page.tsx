import { createClient } from '@/lib/supabase/server'
import { SearchView } from '@/components/dashboard/search-view'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <SearchView userId={user?.id ?? ''} />
}
