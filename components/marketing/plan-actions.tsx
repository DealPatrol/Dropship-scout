'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckoutButton } from '@/components/marketing/checkout-button'
import { SignupLink } from '@/components/marketing/signup-link'
import { Button } from '@/components/ui/button'

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

export function ProPlanAction() {
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
      <div className="mt-6">
        <CheckoutButton source="pricing">Continue to Pro checkout</CheckoutButton>
      </div>
    )
  }

  return (
    <SignupLink href="/auth/sign-up?plan=pro" location="pricing-pro" className="inline-block mt-6">
      <Button>Create account and continue to checkout</Button>
    </SignupLink>
  )
}
