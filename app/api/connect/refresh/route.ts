import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createRecipientOnboardingLink } from '@/lib/connect'
import { env } from '@/lib/env'
import { getStoreProfile } from '@/lib/store-db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.redirect(`${env.appUrl}/auth/login`)
  const profile = await getStoreProfile(user.id)
  if (!profile?.stripeAccountId) return NextResponse.redirect(`${env.appUrl}/dashboard/store`)
  try {
    const url = await createRecipientOnboardingLink(profile.stripeAccountId)
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.redirect(`${env.appUrl}/dashboard/store?connect=error`)
  }
}
