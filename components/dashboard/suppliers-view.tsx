'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCents } from '@/lib/commerce/money'

interface Source {
  provider: string
  configured: boolean
  detail: string
}

interface Product {
  id: string
  provider: string
  title: string
  costCents: number
  shippingCents: number
  supplierName: string | null
  available: boolean
}

export function SuppliersView() {
  const [sources, setSources] = useState<Source[]>([])
  const [direct, setDirect] = useState<Product[]>([])
  const [imported, setImported] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [price, setPrice] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const [directResponse, importedResponse] = await Promise.all([
      fetch('/api/suppliers/direct'),
      fetch('/api/suppliers/import'),
    ])
    const directBody = await directResponse.json()
    const importedBody = await importedResponse.json()
    setSources(directBody.sources ?? [])
    setDirect(directBody.products ?? [])
    setImported(importedBody.products ?? [])
  }

  useEffect(() => { void load() }, [])

  async function importFrom(provider: string) {
    setBusy(true)
    setError(null)
    setMessage(null)
    const response = await fetch('/api/suppliers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, query }),
    })
    const body = await response.json()
    setBusy(false)
    if (!response.ok) {
      setError(body.error || 'Import failed')
      return
    }
    setMessage(`Imported ${body.imported} ${provider} variant${body.imported === 1 ? '' : 's'}.`)
    setImported(body.products ?? [])
    await load()
  }

  async function addListing(product: Product) {
    setError(null)
    const dollars = Number(price[product.id] || ((product.costCents + product.shippingCents) / 100 * 2).toFixed(2))
    const response = await fetch('/api/store/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierProductId: product.id,
        title: product.title,
        priceCents: Math.round(dollars * 100),
      }),
    })
    const body = await response.json()
    if (!response.ok) {
      setError(body.error || 'Could not add the product')
      return
    }
    setMessage(`Added “${product.title}”. Publish it from Your store.`)
  }

  const catalog = [...imported, ...direct.filter(product => !imported.some(item => item.id === product.id))]

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every product you sell comes from CJ Dropshipping, Printful, Printify, or a supplier who joined this platform.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {sources.map(source => (
          <Card key={source.provider}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">{source.provider}</CardTitle>
              <CardDescription>{source.configured ? 'API connected' : 'Not configured'}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{source.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import a live catalog</CardTitle>
          <CardDescription>CJ searches its wholesale catalog. Printful and Printify import products already created in the platform accounts.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search, for example portable fan" />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => importFrom('cj')}>Import CJ</Button>
            <Button disabled={busy} variant="outline" onClick={() => importFrom('printful')}>Import Printful</Button>
            <Button disabled={busy} variant="outline" onClick={() => importFrom('printify')}>Import Printify</Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3">
        {catalog.map(product => (
          <div key={product.id} className="rounded-lg border border-border p-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <p className="font-medium text-sm">{product.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {product.provider}{product.supplierName ? ` · ${product.supplierName}` : ''} · cost {formatCents(product.costCents)} · ship {formatCents(product.shippingCents)}
              </p>
            </div>
            <Input
              className="md:w-28"
              inputMode="decimal"
              placeholder="Retail $"
              value={price[product.id] ?? ''}
              onChange={event => setPrice(current => ({ ...current, [product.id]: event.target.value }))}
            />
            <Button size="sm" onClick={() => addListing(product)} disabled={!product.available}>Add to store</Button>
          </div>
        ))}
        {catalog.length === 0 && <p className="text-sm text-muted-foreground">No supplier products imported yet.</p>}
      </div>
    </div>
  )
}
