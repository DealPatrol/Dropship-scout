import { createClient } from '@/lib/supabase/server'
import { RecommendationsView } from '@/components/dashboard/recommendations-view'

export default async function RecommendationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <RecommendationsView userId={user?.id ?? ''} />
}
