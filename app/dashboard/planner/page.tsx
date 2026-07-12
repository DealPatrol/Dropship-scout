import { createClient } from '@/lib/supabase/server'
import { PlannerView } from '@/components/merchandising/planner-view'

export default async function PlannerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <PlannerView userId={user?.id ?? ''} />
}
