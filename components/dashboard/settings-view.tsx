'use client'

import { useState, useEffect, useCallback } from 'react'
import { saveShopifyCredentials, getShopifyDomain, validateShopify } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, ShoppingBag, User, Shield, Plug } from 'lucide-react'

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
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ valid: boolean; shopName?: string; error?: string } | null>(null)

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSavedSuccess(false)
    setTestResult(null)
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

  async function handleTest() {
    if (!domain || !token) return
    setTesting(true)
    setTestResult(null)
    try {
      const result = await validateShopify(domain.replace(/\.myshopify\.com$/, ''), token)
      setTestResult(result)
    } catch {
      setTestResult({ valid: false, error: 'Connection test failed' })
    } finally {
      setTesting(false)
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

        {/* Shopify integration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Shopify Integration
            </CardTitle>
            <CardDescription>
              Connect your Shopify store to push products directly from your saved list.
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
                      onChange={e => { setDomain(e.target.value); setTestResult(null) }}
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
                    onChange={e => { setToken(e.target.value); setTestResult(null) }}
                    placeholder={domain ? 'Leave blank to keep existing token' : 'shpat_xxxxxxxxxxxx'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a Custom App in your Shopify Admin and copy the Admin API access token.
                  </p>
                </div>

                {/* Test connection result */}
                {testResult && (
                  <div className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
                    testResult.valid
                      ? 'text-green-400 bg-green-400/10 border border-green-400/20'
                      : 'text-destructive bg-destructive/10 border border-destructive/20'
                  }`}>
                    {testResult.valid ? (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <Plug className="h-4 w-4 shrink-0" />
                    )}
                    {testResult.valid
                      ? `Connected to ${testResult.shopName}`
                      : testResult.error || 'Connection failed'}
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                {savedSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    Shopify credentials saved
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save credentials'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={testing || !domain || !token}
                    onClick={handleTest}
                    className="gap-2"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Plug className="h-4 w-4" />
                        Test connection
                      </>
                    )}
                  </Button>
                </div>
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
                Your Shopify access token is stored server-side and never exposed to the browser. It is only used when pushing products to your store.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
