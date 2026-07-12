import { createClient } from '@/lib/supabase/server'
import { OverviewView } from '@/components/merchandising/overview-view'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <OverviewView userId={user?.id ?? ''} email={user?.email ?? 'there'} />
}
