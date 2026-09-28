'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/commerce/money'
import { clearCart, readCart, writeCart, type CartLine } from '@/lib/storefront-cart'

export function CartView({ slug, checkout = false }: { slug: string; checkout?: boolean }) {
  const router = useRouter()
  const [lines, setLines] = useState<CartLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    setLines(readCart(slug))
  }, [slug])

  const merchandise = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0)
  const shipping = lines.reduce((sum, line) => sum + line.shippingCents * line.quantity, 0)

  function updateQuantity(listingId: string, quantity: number) {
    const next = lines
      .map(line => line.listingId === listingId ? { ...line, quantity } : line)
      .filter(line => line.quantity > 0)
    setLines(next)
    writeCart(slug, next)
  }

  async function pay() {
    setPaying(true)
    setError(null)
    try {
      const response = await fetch(`/api/store/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: lines.map(line => ({ listingId: line.listingId, quantity: line.quantity })),
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.url) throw new Error(data.error || 'Could not start checkout')
      clearCart(slug)
      window.location.assign(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
      setPaying(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link href={`/store/${slug}`} className="text-primary text-sm mt-3 inline-block">Continue shopping</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-3">
        {lines.map(line => (
          <div key={line.listingId} className="flex gap-4 rounded-lg border border-border p-4">
            {line.imageUrl && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="80px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium">{line.title}</p>
              <p className="text-sm text-muted-foreground">{formatCents(line.priceCents)}</p>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-muted-foreground" htmlFor={`qty-${line.listingId}`}>Qty</label>
                <input
                  id={`qty-${line.listingId}`}
                  type="number"
                  min={1}
                  max={20}
                  value={line.quantity}
                  onChange={event => updateQuantity(line.listingId, Number(event.target.value))}
                  className="w-16 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                />
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => updateQuantity(line.listingId, 0)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="rounded-lg border border-border p-4 h-fit">
        <h2 className="font-semibold mb-3">{checkout ? 'Checkout' : 'Summary'}</h2>
        <div className="text-sm flex flex-col gap-1 text-muted-foreground">
          <p className="flex justify-between"><span>Items</span><span>{formatCents(merchandise)}</span></p>
          <p className="flex justify-between"><span>Shipping</span><span>{formatCents(shipping)}</span></p>
          <p className="flex justify-between text-foreground font-medium pt-2"><span>Total</span><span>{formatCents(merchandise + shipping)}</span></p>
        </div>
        {checkout ? (
          <>
            <p className="text-xs text-muted-foreground mt-3">
              Stripe collects the card and shipping address. Test cards stay in test mode.
            </p>
            {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            <Button className="w-full mt-4" onClick={pay} disabled={paying}>
              {paying ? 'Redirecting…' : 'Pay with Stripe'}
            </Button>
          </>
        ) : (
          <Button className="w-full mt-4" onClick={() => router.push(`/store/${slug}/checkout`)}>
            Checkout
          </Button>
        )}
      </aside>
    </div>
  )
}
