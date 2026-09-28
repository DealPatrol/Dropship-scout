'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/commerce/money'

interface OrderRow {
  id: string
  publicToken: string
  status: string
  customerEmail: string | null
  grossCents: number
  sellerTransferCents: number | null
  supplierCostCents: number | null
  platformFeeCents: number | null
  stripeFeeCents: number | null
  failureReason: string | null
  trackingNumber: string | null
}

export function OrdersView({ storeSlug }: { storeSlug: string | null }) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const response = await fetch('/api/orders')
    const body = await response.json()
    setOrders(body.orders ?? [])
  }

  useEffect(() => { void load() }, [])

  async function refund(orderId: string) {
    setError(null)
    const response = await fetch(`/api/orders/${orderId}/refund`, { method: 'POST' })
    const body = await response.json()
    if (!response.ok) {
      setError(body.error || 'Refund failed')
      return
    }
    await load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Paid orders are sent to the supplier, then the seller and any direct supplier are paid from the charge.
      </p>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      <div className="flex flex-col gap-3">
        {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
        {orders.map(order => (
          <div key={order.id} className="rounded-lg border border-border p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-medium text-sm capitalize">{order.status.replaceAll('_', ' ')}</p>
                <p className="text-xs text-muted-foreground">{order.customerEmail || 'Customer pending'}</p>
              </div>
              <p className="text-sm">{formatCents(order.grossCents)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supplier {order.supplierCostCents === null ? '—' : formatCents(order.supplierCostCents)}
              {' · '}Seller {order.sellerTransferCents === null ? '—' : formatCents(order.sellerTransferCents)}
              {' · '}Platform {order.platformFeeCents === null ? '—' : formatCents(order.platformFeeCents)}
              {' · '}Stripe {order.stripeFeeCents === null ? '—' : formatCents(order.stripeFeeCents)}
            </p>
            {order.trackingNumber && <p className="text-xs mt-2">Tracking {order.trackingNumber}</p>}
            {order.failureReason && <p className="text-xs text-destructive mt-2">{order.failureReason}</p>}
            <div className="flex gap-3 mt-3">
              {storeSlug && (
                <a className="text-xs text-primary" href={`/store/${storeSlug}/orders/${order.publicToken}`}>Customer page</a>
              )}
              {order.status === 'fulfilled' && (
                <Button size="sm" variant="outline" onClick={() => refund(order.id)}>Refund</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
