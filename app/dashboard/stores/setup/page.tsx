'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createStoreConnection } from '@/app/actions/store-connections'
import { Copy, CheckCircle } from 'lucide-react'

export default function StoreSetupPage() {
  const [storeName, setStoreName] = useState('')
  const [storeType, setStoreType] = useState('shopify')
  const [loading, setLoading] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreateStore = async () => {
    if (!storeName.trim()) {
      alert('Please enter a store name')
      return
    }

    setLoading(true)
    try {
      const result = await createStoreConnection({
        platform: storeType as any,
        storeName: storeName.trim(),
        storeUrl: `https://${storeName}.${storeType === 'shopify' ? 'myshopify.com' : 'com'}`,
      })

      if (result) {
        // Generate webhook URL
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const url = `${baseUrl}/api/webhooks/orders?storeId=${result.id}&signature=YOUR_WEBHOOK_SECRET`
        setWebhookUrl(url)
        setStoreName('')
      }
    } catch (error) {
      console.error('Failed to create store:', error)
      alert('Failed to create store connection')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (webhookUrl) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Store Connected Successfully!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Your Webhook URL:</h3>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-background border rounded-md text-sm font-mono break-all">
                  {webhookUrl}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-900">Next Steps:</h4>
              <ol className="space-y-2 text-sm text-blue-900 list-decimal list-inside">
                <li>Copy the webhook URL above</li>
                <li>Go to your store's webhook/integration settings</li>
                <li>Paste the URL and subscribe to "Order Created" events</li>
                <li>When customers place orders, they'll automatically appear here</li>
              </ol>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-amber-900">Platform-Specific Instructions:</h4>
              <div className="space-y-2 text-sm text-amber-900">
                <div>
                  <strong>Shopify:</strong> Settings → Webhooks → Create webhook → Paste URL → Subscribe to orders/create event
                </div>
                <div>
                  <strong>WooCommerce:</strong> Plugins → WooCommerce Webhooks → Create → Paste URL → Select order.created event
                </div>
                <div>
                  <strong>BigCommerce:</strong> Settings → API → Webhooks → Create → Paste URL → Select order.created scope
                </div>
                <div>
                  <strong>Custom Store:</strong> Add webhook in your settings and point to this URL
                </div>
              </div>
            </div>

            <Button onClick={() => setWebhookUrl(null)} variant="outline" className="w-full">
              Connect Another Store
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Store</CardTitle>
          <CardDescription>
            Works with Shopify, WooCommerce, BigCommerce, and any platform with webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Store"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Platform (Optional)</label>
              <select
                value={storeType}
                onChange={(e) => setStoreType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="bigcommerce">BigCommerce</option>
                <option value="custom">Custom / Other</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                We auto-detect your platform from webhook format, so this is just for your reference
              </p>
            </div>

            <Button
              onClick={handleCreateStore}
              disabled={loading || !storeName.trim()}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Generate Webhook URL'}
            </Button>

            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-semibold">How it works:</p>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>We generate a unique webhook URL for your store</li>
                <li>You add it to your store's webhook settings</li>
                <li>When orders are created, your store sends us the details</li>
                <li>We automatically process and fulfill the orders</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
