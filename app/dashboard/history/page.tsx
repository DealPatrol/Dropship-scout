import { createClient } from '@/lib/supabase/server'
import { PushHistoryView } from '@/components/dashboard/push-history-view'

export default async function PushHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <PushHistoryView userId={user?.id ?? ''} />
}
