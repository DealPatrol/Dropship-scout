'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCents } from '@/lib/commerce/money'

interface StoreProfile {
  storeSlug: string | null
  storeName: string | null
  storePublished: boolean
  connectTransfersStatus: string | null
  stripeAccountId: string | null
}

interface Listing {
  id: string
  title: string
  priceCents: number
  published: boolean
  provider: string
  costCents: number
  shippingCents: number
}

export function StoreView() {
  const [profile, setProfile] = useState<StoreProfile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [published, setPublished] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [profileResponse, listingResponse] = await Promise.all([
      fetch('/api/store/profile'),
      fetch('/api/store/listings'),
    ])
    const profileBody = await profileResponse.json()
    const listingBody = await listingResponse.json()
    const next = profileBody.profile as StoreProfile | null
    setProfile(next)
    setStoreName(next?.storeName ?? '')
    setStoreSlug(next?.storeSlug ?? '')
    setPublished(Boolean(next?.storePublished))
    setListings(listingBody.listings ?? [])
  }, [])

  useEffect(() => { void load() }, [load])

  async function saveStore(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const response = await fetch('/api/store/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName, storeSlug, storePublished: published }),
    })
    const body = await response.json()
    setBusy(false)
    if (!response.ok) {
      setError(body.error || 'Could not save the store')
      return
    }
    setMessage('Store saved.')
    await load()
  }

  async function connect() {
    setBusy(true)
    setError(null)
    const response = await fetch('/api/connect/onboard', { method: 'POST' })
    const body = await response.json()
    setBusy(false)
    if (!response.ok || !body.url) {
      setError(body.error || 'Could not start payout setup')
      return
    }
    window.location.assign(body.url)
  }

  async function openDashboard() {
    const response = await fetch('/api/connect/dashboard', { method: 'POST' })
    const body = await response.json()
    if (!response.ok || !body.url) {
      setError(body.error || 'Could not open payouts')
      return
    }
    window.location.assign(body.url)
  }

  async function toggleListing(listing: Listing, nextPublished: boolean) {
    setError(null)
    const response = await fetch('/api/store/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id, published: nextPublished }),
    })
    const body = await response.json()
    if (!response.ok) {
      setError(body.error || 'Could not update the listing')
      return
    }
    await load()
  }

  const payouts = profile?.connectTransfersStatus === 'active' ? 'Ready' : profile?.stripeAccountId ? 'Pending' : 'Not connected'

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Your store</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publish a storefront on Dropship Scout. Shopify is optional and not required to sell.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payouts</CardTitle>
          <CardDescription>Stripe Connect Express. Sellers receive the sale minus supplier cost, Stripe fees, and the platform fee.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm">Status: {payouts}</p>
          <div className="flex gap-2">
            <Button onClick={connect} disabled={busy}>{profile?.stripeAccountId ? 'Continue setup' : 'Connect payouts'}</Button>
            {profile?.stripeAccountId && <Button variant="outline" onClick={openDashboard}>Payout dashboard</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storefront</CardTitle>
          <CardDescription>Customers visit /store/your-link. Publishing requires active payouts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveStore} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="store-name">Store name</Label>
              <Input id="store-name" value={storeName} onChange={event => setStoreName(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor="store-slug">Store link</Label>
              <Input id="store-slug" value={storeSlug} onChange={event => setStoreSlug(event.target.value)} placeholder="ada-goods" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} />
              Publish storefront
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-green-400">{message}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>Save store</Button>
              {profile?.storeSlug && profile.storePublished && (
                <Link href={`/store/${profile.storeSlug}`} className="text-sm text-primary self-center">View storefront</Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listings</CardTitle>
          <CardDescription>Import products from Suppliers, then publish them here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {listings.length === 0 && <p className="text-sm text-muted-foreground">No listings yet.</p>}
          {listings.map(listing => (
            <div key={listing.id} className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-sm font-medium">{listing.title}</p>
                <p className="text-xs text-muted-foreground">
                  {listing.provider} · sell {formatCents(listing.priceCents)} · cost {formatCents(listing.costCents + listing.shippingCents)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggleListing(listing, !listing.published)}>
                {listing.published ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          ))}
          <Link href="/dashboard/suppliers" className="text-sm text-primary">Import supplier products</Link>
        </CardContent>
      </Card>
    </div>
  )
}
