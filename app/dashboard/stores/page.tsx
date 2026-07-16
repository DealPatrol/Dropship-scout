import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { StoresView } from '@/components/dashboard/stores-view'

export default async function StoresPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/auth/login')

  return <StoresView />
}
