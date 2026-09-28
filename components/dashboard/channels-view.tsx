'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Channel {
  id: string
  name: string
  status: 'live' | 'coming_soon'
  summary: string
  detail: string
}

interface Connections {
  hosted: { slug: string | null; published: boolean }
  shopify: { domain: string | null }
  woocommerce: { url: string | null }
}

interface ActionResult {
  synced?: number
  imported?: number
  errors?: string[]
  skipped?: { externalOrderId: string; reason: string }[]
  error?: string
}

export function ChannelsView() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [connections, setConnections] = useState<Connections | null>(null)
  const [pauseReason, setPauseReason] = useState<string | null>(null)
  const [shopDomain, setShopDomain] = useState('')
  const [shopToken, setShopToken] = useState('')
  const [wooUrl, setWooUrl] = useState('')
  const [wooKey, setWooKey] = useState('')
  const [wooSecret, setWooSecret] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const response = await fetch('/api/channels')
    const body = await response.json()
    if (!response.ok) {
      setError(body.error || 'Could not load sales channels')
      return
    }
    setChannels(body.channels ?? [])
    setConnections(body.connections)
    setPauseReason(body.pauseReason)
    setShopDomain(body.connections?.shopify?.domain?.replace('.myshopify.com', '') ?? '')
    setWooUrl(body.connections?.woocommerce?.url ?? '')
  }, [])

  useEffect(() => { void load() }, [load])

  async function run(path: string, init?: RequestInit, success?: string) {
    setBusy(true)
    setError(null)
    setMessage(null)
    const response = await fetch(path, init)
    const body = await response.json() as ActionResult
    setBusy(false)
    if (!response.ok) {
      setError(body.error || 'Request failed')
      return
    }
    const problems = [...(body.errors ?? []), ...(body.skipped ?? []).map(item => `${item.externalOrderId}: ${item.reason}`)]
    if (typeof body.synced === 'number') {
      setMessage(`Synced ${body.synced} product${body.synced === 1 ? '' : 's'}.${problems.length ? ` ${problems.join(' ')}` : ''}`)
    } else if (typeof body.imported === 'number') {
      setMessage(`Imported ${body.imported} order${body.imported === 1 ? '' : 's'}.${problems.length ? ` ${problems.join(' ')}` : ''}`)
    } else {
      setMessage(success ?? 'Saved.')
    }
    await load()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Sales channels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The hosted storefront is the default. External shops are optional, and a channel is marked live only when this app can call its API.
        </p>
      </div>
      {pauseReason && <p className="text-sm text-amber-300">{pauseReason}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm text-green-400">{message}</p>}

      {channels.map(channel => (
        <Card key={channel.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">{channel.name}</CardTitle>
              <StatusBadge status={channel.status} />
            </div>
            <CardDescription>{channel.summary}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{channel.detail}</p>
            {channel.id === 'hosted' && (
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/store" className="text-sm text-primary">Manage your store</Link>
                {connections?.hosted.published && connections.hosted.slug && (
                  <Link href={`/store/${connections.hosted.slug}`} className="text-sm text-primary">View storefront</Link>
                )}
              </div>
            )}
            {channel.id === 'shopify' && (
              <ShopifyPanel
                connected={Boolean(connections?.shopify.domain)}
                domain={shopDomain}
                token={shopToken}
                busy={busy}
                onDomain={setShopDomain}
                onToken={setShopToken}
                onConnect={() => run('/api/shopify/credentials', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ domain: shopDomain, token: shopToken }),
                }, 'Shopify connected.')}
                onDisconnect={() => run('/api/shopify/credentials', { method: 'DELETE' }, 'Shopify disconnected.')}
                onSync={() => run('/api/channels/shopify/sync', { method: 'POST' })}
                onPull={() => run('/api/channels/shopify/orders', { method: 'POST' })}
              />
            )}
            {channel.id === 'woocommerce' && (
              <WooPanel
                connected={Boolean(connections?.woocommerce.url)}
                url={wooUrl}
                apiKey={wooKey}
                secret={wooSecret}
                busy={busy}
                onUrl={setWooUrl}
                onKey={setWooKey}
                onSecret={setWooSecret}
                onConnect={() => run('/api/channels/woocommerce', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: wooUrl, key: wooKey, secret: wooSecret }),
                }, 'WooCommerce connected.')}
                onDisconnect={() => run('/api/channels/woocommerce', { method: 'DELETE' }, 'WooCommerce disconnected.')}
                onSync={() => run('/api/channels/woocommerce/sync', { method: 'POST' })}
                onPull={() => run('/api/channels/woocommerce/orders', { method: 'POST' })}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: 'live' | 'coming_soon' }) {
  const live = status === 'live'
  return (
    <span className={live
      ? 'rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
      : 'rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground'}>
      {live ? 'Live' : 'Coming soon'}
    </span>
  )
}

function ShopifyPanel(props: {
  connected: boolean
  domain: string
  token: string
  busy: boolean
  onDomain: (value: string) => void
  onToken: (value: string) => void
  onConnect: () => void
  onDisconnect: () => void
  onSync: () => void
  onPull: () => void
}) {
  return (
    <form className="flex flex-col gap-3" onSubmit={event => { event.preventDefault(); props.onConnect() }}>
      <div>
        <Label htmlFor="shopify-domain">Store domain</Label>
        <div className="flex items-center rounded-md border border-input overflow-hidden">
          <Input id="shopify-domain" value={props.domain} onChange={event => props.onDomain(event.target.value)} className="border-0" required />
          <span className="px-3 text-sm text-muted-foreground border-l border-input">.myshopify.com</span>
        </div>
      </div>
      <div>
        <Label htmlFor="shopify-token">Admin API access token</Label>
        <Input id="shopify-token" type="password" value={props.token} onChange={event => props.onToken(event.target.value)} autoComplete="off" placeholder={props.connected ? 'Leave blank to keep the saved token' : 'shpat_…'} />
      </div>
      <p className="text-xs text-muted-foreground">
        Custom app scopes: write_products, read_orders, write_orders. The token is validated with Shopify before it is saved.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={props.busy}>{props.connected ? 'Update connection' : 'Connect Shopify'}</Button>
        {props.connected && (
          <>
            <Button type="button" variant="outline" disabled={props.busy} onClick={props.onSync}>Sync catalog</Button>
            <Button type="button" variant="outline" disabled={props.busy} onClick={props.onPull}>Pull orders</Button>
            <Button type="button" variant="ghost" disabled={props.busy} onClick={props.onDisconnect}>Disconnect</Button>
          </>
        )}
      </div>
    </form>
  )
}

function WooPanel(props: {
  connected: boolean
  url: string
  apiKey: string
  secret: string
  busy: boolean
  onUrl: (value: string) => void
  onKey: (value: string) => void
  onSecret: (value: string) => void
  onConnect: () => void
  onDisconnect: () => void
  onSync: () => void
  onPull: () => void
}) {
  return (
    <form className="flex flex-col gap-3" onSubmit={event => { event.preventDefault(); props.onConnect() }}>
      <div>
        <Label htmlFor="woo-url">Store URL</Label>
        <Input id="woo-url" type="url" value={props.url} onChange={event => props.onUrl(event.target.value)} placeholder="https://shop.example.com" required />
      </div>
      <div>
        <Label htmlFor="woo-key">Consumer key</Label>
        <Input id="woo-key" value={props.apiKey} onChange={event => props.onKey(event.target.value)} autoComplete="off" required={!props.connected} />
      </div>
      <div>
        <Label htmlFor="woo-secret">Consumer secret</Label>
        <Input id="woo-secret" type="password" value={props.secret} onChange={event => props.onSecret(event.target.value)} autoComplete="off" required={!props.connected} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={props.busy}>{props.connected ? 'Update connection' : 'Connect WooCommerce'}</Button>
        {props.connected && (
          <>
            <Button type="button" variant="outline" disabled={props.busy} onClick={props.onSync}>Sync catalog</Button>
            <Button type="button" variant="outline" disabled={props.busy} onClick={props.onPull}>Pull orders</Button>
            <Button type="button" variant="ghost" disabled={props.busy} onClick={props.onDisconnect}>Disconnect</Button>
          </>
        )}
      </div>
    </form>
  )
}
