'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Profile {
  displayName: string
  slug: string
  notifyUrl: string | null
  connectTransfersStatus: string | null
}

interface QueueOrder {
  jobId: string
  title: string
  quantity: number
  status: string
  customerName: string | null
  trackingNumber: string | null
  address: { address1?: string; city?: string; province?: string; zip?: string; countryCode?: string } | null
}

export function SupplierDeskView() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<QueueOrder[]>([])
  const [displayName, setDisplayName] = useState('')
  const [slug, setSlug] = useState('')
  const [notifyUrl, setNotifyUrl] = useState('')
  const [title, setTitle] = useState('')
  const [cost, setCost] = useState('')
  const [shipping, setShipping] = useState('')
  const [stock, setStock] = useState('10')
  const [tracking, setTracking] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const [profileResponse, orderResponse] = await Promise.all([
      fetch('/api/supplier/profile'),
      fetch('/api/supplier/orders'),
    ])
    const profileBody = await profileResponse.json()
    const orderBody = await orderResponse.json()
    const next = profileBody.profile as Profile | null
    setProfile(next)
    setDisplayName(next?.displayName ?? '')
    setSlug(next?.slug ?? '')
    setNotifyUrl(next?.notifyUrl ?? '')
    setOrders(orderBody.orders ?? [])
  }

  useEffect(() => { void load() }, [])

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const response = await fetch('/api/supplier/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, slug, notifyUrl }),
    })
    const body = await response.json()
    if (!response.ok) {
      setError(body.error || 'Could not save supplier profile')
      return
    }
    setMessage('Supplier profile saved.')
    await load()
  }

  async function addProduct(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const response = await fetch('/api/supplier/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, cost: Number(cost), shipping: Number(shipping), stock: Number(stock) }),
    })
    const body = await response.json()
    if (!response.ok) {
      setError(body.error || 'Could not add product')
      return
    }
    setTitle('')
    setMessage('Product added. Sellers can import it once your payouts are active.')
  }

  async function ship(jobId: string) {
    setError(null)
    const response = await fetch('/api/supplier/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, trackingNumber: tracking[jobId] || '' }),
    })
    const body = await response.json()
    if (!response.ok) {
      setError(body.error || 'Could not save tracking')
      return
    }
    await load()
  }

  async function connectPayouts() {
    const response = await fetch('/api/connect/onboard', { method: 'POST' })
    const body = await response.json()
    if (!response.ok || !body.url) {
      setError(body.error || 'Could not start payout setup')
      return
    }
    window.location.assign(body.url)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Supplier desk</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Independent suppliers onboard here, add real products, and receive order notifications plus Stripe payouts.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-green-400">{message}</p>}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Payout status: {profile?.connectTransfersStatus === 'active' ? 'Ready' : 'Not ready'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="supplier-name">Name</Label>
              <Input id="supplier-name" value={displayName} onChange={event => setDisplayName(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor="supplier-slug">Link</Label>
              <Input id="supplier-slug" value={slug} onChange={event => setSlug(event.target.value)} required disabled={Boolean(profile)} />
            </div>
            <div>
              <Label htmlFor="notify-url">Notification URL</Label>
              <Input id="notify-url" value={notifyUrl} onChange={event => setNotifyUrl(event.target.value)} placeholder="https://example.com/orders" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save supplier</Button>
              <Button type="button" variant="outline" onClick={connectPayouts}>Connect payouts</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a product</CardTitle>
          <CardDescription>Cost and shipping are what you get paid when a seller’s customer buys it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addProduct} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="product-title">Title</Label>
              <Input id="product-title" value={title} onChange={event => setTitle(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor="product-cost">Cost (USD)</Label>
              <Input id="product-cost" value={cost} onChange={event => setCost(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor="product-shipping">Shipping (USD)</Label>
              <Input id="product-shipping" value={shipping} onChange={event => setShipping(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor="product-stock">Stock</Label>
              <Input id="product-stock" value={stock} onChange={event => setStock(event.target.value)} required />
            </div>
            <div className="self-end">
              <Button type="submit" disabled={!profile}>Add product</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order queue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          {orders.map(order => (
            <div key={order.jobId} className="border-b border-border pb-3">
              <p className="text-sm font-medium">{order.title} × {order.quantity}</p>
              <p className="text-xs text-muted-foreground">
                {order.customerName || 'Customer'} · {order.address?.address1} {order.address?.city} {order.address?.province} {order.address?.zip} {order.address?.countryCode}
              </p>
              <p className="text-xs mt-1 capitalize">{order.status.replaceAll('_', ' ')}</p>
              {order.trackingNumber ? (
                <p className="text-xs mt-2">Tracking {order.trackingNumber}</p>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tracking[order.jobId] ?? ''}
                    onChange={event => setTracking(current => ({ ...current, [order.jobId]: event.target.value }))}
                    placeholder="Tracking number"
                  />
                  <Button size="sm" onClick={() => ship(order.jobId)}>Mark shipped</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
