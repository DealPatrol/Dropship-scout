'use client'

import { useEffect, useState } from 'react'
import { getOrders } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Package, Eye, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'
import type { Order } from '@/lib/types'

export function OrdersView() {
  const [orderData, setOrderData] = useState<{ orders: Order[]; total: number }>({ orders: [], total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrders(50, 0)
        setOrderData(data)
      } catch (error) {
        console.error('Failed to load orders:', error)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  const totalProfit = orderData.orders.reduce((sum, order) => sum + (Number(order.profit) || 0), 0)
  const totalRevenue = orderData.orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)
  const deliveredCount = orderData.orders.filter(o => o.status === 'delivered').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700'
      case 'submitted':
        return 'bg-blue-500/10 text-blue-700'
      case 'shipped':
        return 'bg-purple-500/10 text-purple-700'
      case 'delivered':
        return 'bg-green-500/10 text-green-700'
      case 'failed':
        return 'bg-red-500/10 text-red-700'
      default:
        return 'bg-gray-500/10 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-raised rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage your store orders and fulfillment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-foreground mt-1">{orderData.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Profit</p>
                <p className="text-2xl font-bold text-green-600 mt-1">${totalProfit.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Delivered</p>
                <p className="text-2xl font-bold text-foreground mt-1">{deliveredCount}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {orderData.orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-medium text-foreground">No orders yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Orders from your connected stores will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-foreground">Order ID</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Total</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Profit</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                <th className="text-left py-3 px-4 font-medium text-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {orderData.orders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 text-foreground font-medium">#{order.storeOrderId}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-foreground">${Number(order.totalAmount).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={Number(order.profit) > 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                      ${Number(order.profit).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button size="sm" variant="ghost" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
