'use client'

import { useState, useEffect, useCallback } from 'react'
import { saveShopifyCredentials, getShopifyDomain } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, CreditCard, ShoppingBag, User, Shield } from 'lucide-react'

interface SettingsViewProps {
  userId: string
  userEmail: string
}

export function SettingsView({ userId, userEmail }: SettingsViewProps) {
  const [domain, setDomain] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  const loadCredentials = useCallback(async () => {
    try {
      const d = await getShopifyDomain(userId)
      if (d) setDomain(d)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadCredentials() }, [loadCredentials])

  useEffect(() => {
    fetch('/api/billing/status')
      .then(response => response.json())
      .then(data => {
        setPlan(data.plan === 'pro' ? 'pro' : 'free')
        setHasStripeCustomer(Boolean(data.hasCustomer))
      })
      .catch(() => undefined)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSavedSuccess(false)
    try {
      await saveShopifyCredentials(userId, domain, token)
      setSavedSuccess(true)
      setToken('')
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

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
          Manage your account and integrations
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Account info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input value={userEmail} disabled className="opacity-70 cursor-not-allowed" />
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
                ? 'Pro includes unlimited saved products, catalogs, builds, Shopify pushes, and live supplier adapters.'
                : 'Free includes 10 saved products, 25 catalog products, 10 products per build, and 3 Shopify pushes per month.'}
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

        {/* Shopify integration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Shopify Integration
            </CardTitle>
            <CardDescription>
              Optional. The hosted storefront does not need Shopify. Connect a shop only if you still want to push listings there.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading credentials...
              </div>
            ) : (
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="shopify-domain">Store domain</Label>
                  <div className="flex items-center rounded-md border border-input bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                    <Input
                      id="shopify-domain"
                      value={domain}
                      onChange={e => setDomain(e.target.value)}
                      placeholder="your-store"
                      required
                      className="border-0 rounded-none bg-transparent focus:ring-0"
                    />
                    <span className="px-3 text-sm text-muted-foreground bg-surface-raised border-l border-input whitespace-nowrap">
                      .myshopify.com
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="shopify-token">Access token</Label>
                  <Input
                    id="shopify-token"
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder={domain ? 'Leave blank to keep existing token' : 'shpat_xxxxxxxxxxxx'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a Custom App with product write permission. The token is validated with Shopify before it is saved.
                  </p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                {savedSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    Shopify credentials saved
                  </div>
                )}

                <Button type="submit" disabled={saving} className="w-fit gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save credentials'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security info card */}
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your Shopify access token is encrypted and stored server-side. It is never exposed to the browser and is only used when pushing products to your store.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
