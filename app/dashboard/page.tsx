import { createClient } from '@/lib/supabase/server'
import { SearchView } from '@/components/dashboard/search-view'
import { AnalyticsSummary } from '@/components/dashboard/analytics-summary'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id ?? ''

  return (
    <>
      <AnalyticsSummary userId={userId} />
      <SearchView userId={userId} />
    </>
  )
}
