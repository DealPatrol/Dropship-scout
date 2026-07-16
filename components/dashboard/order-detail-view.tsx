'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getOrder,
  getOrderItems,
  getOrderHistory,
  updateOrderStatus,
  addOrderNote,
} from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Loader2, Copy, Check } from 'lucide-react'
import type { Order, OrderItem, FulfillmentHistory, OrderStatus } from '@/lib/types'

interface OrderDetailViewProps {
  orderId: number
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [history, setHistory] = useState<FulfillmentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadOrder() {
      try {
        const [orderData, itemsData, historyData] = await Promise.all([
          getOrder(orderId),
          getOrderItems(orderId),
          getOrderHistory(orderId),
        ])

        setOrder(orderData)
        setItems(itemsData)
        setHistory(historyData)
      } catch (error) {
        console.error('Failed to load order:', error)
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [orderId])

  async function handleStatusChange(status: OrderStatus) {
    if (!order) return
    setUpdating(true)
    try {
      const updated = await updateOrderStatus(orderId, status)
      setOrder(updated)
      const historyData = await getOrderHistory(orderId)
      setHistory(historyData)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(false)
    }
  }

  async function handleAddNote() {
    if (!note.trim()) return
    setUpdating(true)
    try {
      await addOrderNote(orderId, note)
      setNote('')
      const historyData = await getOrderHistory(orderId)
      setHistory(historyData)
    } catch (error) {
      console.error('Failed to add note:', error)
    } finally {
      setUpdating(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-raised rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Order #{order.storeOrderId}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-foreground">Customer Information</h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Name</p>
              <p className="text-foreground font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Email</p>
              <p className="text-foreground">{order.customerEmail}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-foreground">Order Totals</h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Total Amount</p>
              <p className="text-foreground font-medium">${Number(order.totalAmount).toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Total Cost</p>
              <p className="text-foreground">${Number(order.totalCost).toFixed(2)}</p>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <p className="text-muted-foreground">Profit</p>
              <p className={`font-medium ${Number(order.profit) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Number(order.profit).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-foreground">Shipping Address</h3>
        </CardHeader>
        <CardContent className="text-sm text-foreground">
          <div className="space-y-1">
            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-foreground">Order Items</h3>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-foreground">Qty</th>
                <th className="text-left py-2 font-medium text-foreground">Unit Cost</th>
                <th className="text-left py-2 font-medium text-foreground">Unit Price</th>
                <th className="text-right py-2 font-medium text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{item.quantity}</td>
                  <td className="py-2 text-foreground">${Number(item.unitCost).toFixed(2)}</td>
                  <td className="py-2 text-foreground">${Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-2 text-right text-foreground font-medium">
                    ${Number(item.lineTotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-foreground">Status & Tracking</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Current Status</p>
            <div className="flex gap-2 flex-wrap">
              {(['pending', 'submitted', 'shipped', 'delivered'] as OrderStatus[]).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={order.status === status ? 'default' : 'outline'}
                  disabled={updating}
                  onClick={() => handleStatusChange(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {order.trackingNumber && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tracking Number</p>
              <div className="flex gap-2 items-center">
                <code className="px-3 py-2 bg-muted rounded text-sm text-foreground flex-1">
                  {order.trackingNumber}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(order.trackingNumber!)}
                  className="gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-foreground">Fulfillment Timeline</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-foreground">Add Note</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            placeholder="Add a note about this order..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <Button
            onClick={handleAddNote}
            disabled={!note.trim() || updating}
            className="gap-2"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Note'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
