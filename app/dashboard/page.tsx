import { getSession } from '@/lib/auth'
import { OverviewView } from '@/components/merchandising/overview-view'

export default async function DashboardPage() {
  const user = await getSession()
  return <OverviewView userId={user?.id ?? ''} email={user?.email ?? 'there'} />
}
