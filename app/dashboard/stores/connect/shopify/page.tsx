'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react'

export default function ConnectShopifyPage() {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [shopUrl, setShopUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!shopUrl) {
      setError('Please enter your shop URL')
      return
    }

    // Normalize shop URL
    let normalizedUrl = shopUrl.toLowerCase().trim()
    if (!normalizedUrl.includes('myshopify.com')) {
      normalizedUrl = `${normalizedUrl}.myshopify.com`
    }

    // Generate OAuth URL
    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem(`shopify_state_${state}`, 'true')

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '',
      scope: [
        'write_products',
        'read_products',
        'write_orders',
        'read_orders',
        'write_inventory',
        'read_inventory',
      ].join(','),
      redirect_uri: `${window.location.origin}/api/auth/shopify/callback`,
      state,
    })

    const authUrl = `https://${normalizedUrl}/admin/oauth/authorize?${params.toString()}`
    window.location.href = authUrl
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
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Connect Shopify</h1>
              <p className="text-xs text-muted-foreground">Sync products and orders</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Shopify Store URL
            </label>
            <input
              type="text"
              placeholder="mystore.myshopify.com"
              value={shopUrl}
              onChange={(e) => {
                setShopUrl(e.target.value)
                setError(null)
              }}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your Shopify store URL without the protocol
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleConnect}
            disabled={connecting || !shopUrl}
            className="w-full gap-2"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Continue to Shopify'
            )}
          </Button>

          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to Shopify to authorize access. We request permissions to manage products, orders, and inventory.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
