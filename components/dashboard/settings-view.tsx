'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { startProCheckout } from '@/components/billing/start-checkout'
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
  const [notice, setNotice] = useState<string | null>(null)
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false)
  const [statusLoaded, setStatusLoaded] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [checkoutRequested, setCheckoutRequested] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCheckoutRequested(params.get('checkout') === '1')
    const billing = params.get('billing')
    if (billing === 'success') {
      setNotice('Stripe sent you back after checkout. The plan updates when the webhook marks the subscription active. Refresh if it still says Free.')
    } else if (billing === 'cancelled') {
      setNotice('Checkout was cancelled. You can start it again.')
    } else if (billing === 'unavailable') {
      setNotice('Pro checkout is not configured on this deployment yet.')
    }
  }, [])

  useEffect(() => {
    fetch('/api/billing/status')
      .then(response => response.json())
      .then(data => {
        setPlan(data.plan === 'pro' ? 'pro' : 'free')
        setHasStripeCustomer(Boolean(data.hasCustomer))
      })
      .catch(() => undefined)
      .finally(() => setStatusLoaded(true))
  }, [])

  async function openPortal() {
    const response = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await response.json()
    if (!response.ok || !data.url) throw new Error(data.error || 'Could not open billing')
    window.location.assign(data.url)
  }

  async function handlePortal() {
    setBillingLoading(true)
    setError(null)
    try {
      await openPortal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing')
      setBillingLoading(false)
    }
  }

  async function handleUpgrade() {
    setBillingLoading(true)
    setError(null)
    try {
      const url = await startProCheckout('settings')
      window.location.assign(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start checkout'
      if (message.includes('already exists')) {
        try {
          await openPortal()
          return
        } catch (portalError) {
          setError(portalError instanceof Error ? portalError.message : 'Could not open billing')
          setBillingLoading(false)
          return
        }
      }
      setError(message)
      setBillingLoading(false)
    }
  }

  useEffect(() => {
    if (!statusLoaded || !checkoutRequested || plan === 'pro') return
    const key = 'ds-checkout-autostart'
    if (sessionStorage.getItem(key) === '1') return
    sessionStorage.setItem(key, '1')
    void handleUpgrade()
    // handleUpgrade is recreated each render; this effect should run once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusLoaded, checkoutRequested, plan])

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
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium capitalize">{plan} plan</span>
              {plan === 'pro' ? (
                <Button onClick={() => void handlePortal()} disabled={billingLoading} variant="outline">
                  {billingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage billing
                </Button>
              ) : (
                <Button onClick={() => void handleUpgrade()} disabled={billingLoading}>
                  {billingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upgrade to Pro
                </Button>
              )}
            </div>
            {plan !== 'pro' && hasStripeCustomer && (
              <button type="button" className="text-sm text-primary text-left" onClick={() => void handlePortal()}>
                Open the billing portal
              </button>
            )}
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

        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
