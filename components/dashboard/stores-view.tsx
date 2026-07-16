'use client'

import { useEffect, useState } from 'react'
import { getStoreConnections, deleteStoreConnection, toggleStoreConnection } from '@/app/actions/store-connections'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Store, Plus, Trash2, Power, PowerOff } from 'lucide-react'
import type { StoreConnection } from '@/lib/types'

export function StoresView() {
  const [stores, setStores] = useState<StoreConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

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

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await deleteStoreConnection(id)
      setStores(stores.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete store:', error)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggle(id: number, isActive: boolean) {
    setTogglingId(id)
    try {
      await toggleStoreConnection(id, !isActive)
      setStores(stores.map(s => s.id === id ? { ...s, isActive: !isActive } : s))
    } catch (error) {
      console.error('Failed to toggle store:', error)
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-raised rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Connected Stores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your Shopify and WooCommerce store connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/dashboard/stores/connect/shopify'} className="gap-2">
            <Plus className="h-4 w-4" />
            Connect Shopify
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/stores/connect/woocommerce'} className="gap-2">
            <Plus className="h-4 w-4" />
            Connect WooCommerce
          </Button>
        </div>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Store className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-medium text-foreground">No stores connected</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your first store to start syncing products and orders
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{store.storeName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {store.platform === 'shopify' ? 'Shopify' : 'WooCommerce'} • {store.storeUrl}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={store.isActive ? 'secondary' : 'outline'}
                    disabled={togglingId === store.id}
                    onClick={() => handleToggle(store.id, store.isActive)}
                    className="gap-2"
                  >
                    {store.isActive ? (
                      <><Power className="h-3 w-3" /> Active</>
                    ) : (
                      <><PowerOff className="h-3 w-3" /> Inactive</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deletingId === store.id}
                    onClick={() => handleDelete(store.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
