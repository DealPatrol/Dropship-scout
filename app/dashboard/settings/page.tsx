import { getSession } from '@/lib/auth'
import { SettingsView } from '@/components/dashboard/settings-view'

export default async function SettingsPage() {
  const user = await getSession()
  return <SettingsView userId={user?.id ?? ''} userEmail={user?.email ?? ''} />
}
