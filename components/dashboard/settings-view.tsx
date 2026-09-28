'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard, Plug, User } from 'lucide-react'

interface SettingsViewProps {
  userId: string
  userEmail: string
}

export function SettingsView({ userEmail }: SettingsViewProps) {
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  useEffect(() => {
    fetch('/api/billing/status')
      .then(response => response.json())
      .then(data => {
        setPlan(data.plan === 'pro' ? 'pro' : 'free')
        setHasStripeCustomer(Boolean(data.hasCustomer))
      })
      .catch(() => undefined)
  }, [])

  async function handleBilling() {
    setBillingLoading(true)
    setError(null)
    try {
      const endpoint = plan === 'pro' || hasStripeCustomer
        ? '/api/billing/portal'
        : '/api/billing/checkout'
      const response = await fetch(endpoint, { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.url) throw new Error(data.error || 'Could not open billing')
      window.location.assign(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing')
      setBillingLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Account, billing, and links to the store you sell from.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-email">Email</Label>
              <Input id="account-email" value={userEmail} disabled className="opacity-70 cursor-not-allowed" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Billing
            </CardTitle>
            <CardDescription>
              {plan === 'pro'
                ? 'Pro removes the free-plan limits on saved products, research catalogs, and hosted listings.'
                : 'Free includes 10 saved products, 25 research-catalog products, and 25 hosted store listings.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium capitalize">{plan} plan</span>
            <Button onClick={handleBilling} disabled={billingLoading} variant={plan === 'pro' ? 'outline' : 'default'}>
              {billingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan === 'pro' || hasStripeCustomer ? 'Manage billing' : 'Upgrade to Pro'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plug className="h-4 w-4 text-primary" />
              Sales channels
            </CardTitle>
            <CardDescription>
              The hosted storefront is included with your account. Shopify and WooCommerce can be connected when you want them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/channels" className="text-sm text-primary">Open sales channels</Link>
          </CardContent>
        </Card>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
