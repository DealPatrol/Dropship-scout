import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  if (!user) {
    redirect('/auth/login')
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
