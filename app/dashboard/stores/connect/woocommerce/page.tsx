'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStoreConnection } from '@/app/actions/store-connections'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react'
import { validateWooCommerceUrl } from '@/lib/woocommerce'

export default function ConnectWooCommercePage() {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [storeUrl, setStoreUrl] = useState('')
  const [consumerKey, setConsumerKey] = useState('')
  const [consumerSecret, setConsumerSecret] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setError(null)

    if (!storeUrl || !consumerKey || !consumerSecret) {
      setError('All fields are required')
      return
    }

    if (!validateWooCommerceUrl(storeUrl)) {
      setError('Invalid store URL')
      return
    }

    setConnecting(true)
    try {
      const storeName = new URL(storeUrl).hostname.split('.')[0]

      await createStoreConnection({
        platform: 'woocommerce',
        storeName,
        storeUrl,
        accessToken: consumerKey,
        refreshToken: consumerSecret,
        metadata: {
          type: 'woocommerce_api_keys',
        },
      })

      router.push('/dashboard/stores?connected=woocommerce')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect store')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Connect WooCommerce</h1>
              <p className="text-xs text-muted-foreground">Sync products and orders</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Store URL
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={storeUrl}
              onChange={(e) => {
                setStoreUrl(e.target.value)
                setError(null)
              }}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Consumer Key
            </label>
            <input
              type="password"
              placeholder="ck_..."
              value={consumerKey}
              onChange={(e) => {
                setConsumerKey(e.target.value)
                setError(null)
              }}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Consumer Secret
            </label>
            <input
              type="password"
              placeholder="cs_..."
              value={consumerSecret}
              onChange={(e) => {
                setConsumerSecret(e.target.value)
                setError(null)
              }}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleConnect}
            disabled={connecting || !storeUrl || !consumerKey || !consumerSecret}
            className="w-full gap-2"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Store'
            )}
          </Button>

          <div className="p-3 rounded-lg bg-muted space-y-2">
            <p className="text-xs text-muted-foreground font-medium">How to find your API keys:</p>
            <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
              <li>Go to WooCommerce Settings</li>
              <li>Navigate to Advanced → REST API</li>
              <li>Create a new API key with read/write permissions</li>
              <li>Copy the Consumer Key and Secret</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
