import { getSession } from '@/lib/auth'
import { PushHistoryView } from '@/components/dashboard/push-history-view'

export default async function PushHistoryPage() {
  const user = await getSession()
  return <PushHistoryView userId={user?.id ?? ''} />
}
