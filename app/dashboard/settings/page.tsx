import { createClient } from '@/lib/supabase/server'
import { SettingsView } from '@/components/dashboard/settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <SettingsView userId={user?.id ?? ''} userEmail={user?.email ?? ''} />
}
