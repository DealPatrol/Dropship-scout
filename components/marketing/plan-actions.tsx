'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckoutButton } from '@/components/marketing/checkout-button'
import { SignupLink } from '@/components/marketing/signup-link'
import { Button } from '@/components/ui/button'
import { proAuthHref } from '@/lib/billing'

type PlanState = 'guest' | 'free' | 'pro'

export function FreePlanAction() {
  const [state, setState] = useState<PlanState>('guest')

  useEffect(() => {
    fetch('/api/billing/status')
      .then(async response => {
        if (!response.ok) return
        const data = await response.json()
        setState(data.plan === 'pro' ? 'pro' : 'free')
      })
      .catch(() => undefined)
  }, [])

  if (state === 'guest') {
    return (
      <SignupLink href="/auth/sign-up" location="pricing-free" className="inline-block mt-6">
        <Button>Create a free account</Button>
      </SignupLink>
    )
  }

  return (
    <Link href="/dashboard" className="inline-block mt-6">
      <Button>Go to the dashboard</Button>
    </Link>
  )
}

export function ProPlanAction({ annualAvailable }: { annualAvailable: boolean }) {
  const [state, setState] = useState<PlanState>('guest')

  useEffect(() => {
    fetch('/api/billing/status')
      .then(async response => {
        if (!response.ok) return
        const data = await response.json()
        setState(data.plan === 'pro' ? 'pro' : 'free')
      })
      .catch(() => undefined)
  }, [])

  if (state === 'pro') {
    return (
      <Link href="/dashboard/settings" className="inline-block mt-6">
        <Button variant="outline">Manage billing</Button>
      </Link>
    )
  }

  if (state === 'free') {
    return (
      <div className="mt-6 flex flex-col items-start gap-2">
        <CheckoutButton source="pricing" interval="month">
          {annualAvailable ? 'Continue with monthly billing' : 'Continue to Pro checkout'}
        </CheckoutButton>
        {annualAvailable && (
          <CheckoutButton source="pricing" interval="year" variant="outline">Continue with annual billing</CheckoutButton>
        )}
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col items-start gap-2">
      <SignupLink href={proAuthHref('/auth/sign-up', 'month')} location="pricing-pro" className="inline-block">
        <Button>{annualAvailable ? 'Create account and continue monthly' : 'Create account and continue to checkout'}</Button>
      </SignupLink>
      {annualAvailable && (
        <SignupLink href={proAuthHref('/auth/sign-up', 'year')} location="pricing-pro-annual" className="inline-block">
          <Button variant="outline">Create account and continue yearly</Button>
        </SignupLink>
      )}
    </div>
  )
}
