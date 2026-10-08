import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserProfile } from '@/lib/db'
import { PurchaseConversion } from '@/components/ads/purchase-conversion'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getUserProfile(user.id)
  const plan = profile?.plan === 'pro' ? 'pro' : 'free'

  return (
    <>
      <PurchaseConversion />
      <DashboardShell user={user} plan={plan}>{children}</DashboardShell>
    </>
  )
}
