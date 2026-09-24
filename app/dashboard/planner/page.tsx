import { getSession } from '@/lib/auth'
import { PlannerView } from '@/components/merchandising/planner-view'

export default async function PlannerPage() {
  const user = await getSession()
  return <PlannerView userId={user?.id ?? ''} />
}
