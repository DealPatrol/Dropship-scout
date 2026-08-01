'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStoreConnections, deleteStoreConnection } from '@/app/actions/store-connections'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Plus, Trash2, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import type { StoreConnection } from '@/lib/types'

export function StoresView() {
  const [stores, setStores] = useState<StoreConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    async function loadStores() {
      try {
        const data = await getStoreConnections()
        setStores(data)
      } catch (error) {
        console.error('Failed to load stores:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStores()
  }, [])

  const copyWebhookUrl = (storeId: number) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${baseUrl}/api/webhooks/orders?storeId=${storeId}`
    navigator.clipboard.writeText(url)
    setCopiedId(storeId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this store connection?')) return
    setDeletingId(id)
    try {
      await deleteStoreConnection(id)
      setStores(stores.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete store:', error)
      alert('Failed to delete store')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading stores...</div>
  }

  if (stores.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-12 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No stores connected yet</h3>
            <p className="text-muted-foreground mb-6">
              Connect your ecommerce store to start receiving orders automatically
            </p>
            <Link href="/dashboard/stores/setup">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Connect Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Connected Stores</h2>
          <p className="text-muted-foreground">{stores.length} store(s) connected</p>
        </div>
        <Link href="/dashboard/stores/setup">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {stores.map((store) => {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
          const webhookUrl = `${baseUrl}/api/webhooks/orders?storeId=${store.id}`

          return (
            <Card key={store.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>{store.storeName}</CardTitle>
                      <CardDescription className="capitalize">
                        {store.platform} • {store.storeUrl}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {store.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Webhook URL</label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-2 bg-muted border rounded text-xs font-mono break-all">
                      {webhookUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyWebhookUrl(store.id)}
                    >
                      {copiedId === store.id ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Add this URL to your store's webhook settings to receive orders
                  </p>
                </div>

                {!store.webhooksConfigured && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900">
                    <p className="font-medium mb-1">Webhooks not configured</p>
                    <p className="text-xs">
                      Add the webhook URL to your store settings to start receiving orders
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(store.id)}
                    disabled={deletingId === store.id}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {deletingId === store.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
