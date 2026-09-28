import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StoreFrame } from '@/components/storefront/store-frame'
import { formatCents } from '@/lib/commerce/money'
import { getPublicOrder } from '@/lib/store-db'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Waiting for payment',
  fulfilling: 'Payment received, sending to the supplier',
  fulfilled: 'Order placed with the supplier',
  supplier_rejected: 'Supplier could not fulfill this order. The payment was refunded.',
  refunded: 'Refunded',
  failed: 'Needs attention',
}

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: { slug: string; token: string }
  searchParams: { paid?: string }
}) {
  const order = await getPublicOrder(params.token)
  if (!order || order.storeSlug !== params.slug) notFound()

  return (
    <StoreFrame name={order.storeName} slug={order.storeSlug}>
      <p className="text-xs uppercase tracking-wide text-primary">Order</p>
      <h1 className="text-3xl font-semibold mt-1">Thanks{order.customerName ? `, ${order.customerName}` : ''}</h1>
      <p className="text-muted-foreground mt-2">{STATUS_LABEL[order.status] ?? order.status}</p>
      {searchParams.paid === '1' && order.status === 'pending_payment' && (
        <p className="text-sm mt-3">Payment is confirmed. Supplier placement finishes in a few seconds. Refresh this page for tracking.</p>
      )}
      {order.failureReason && <p className="text-sm text-destructive mt-3">{order.failureReason}</p>}
      <div className="mt-8 rounded-lg border border-border divide-y divide-border">
        {order.items.map(item => (
          <div key={`${item.title}-${item.unitPriceCents}`} className="p-4 flex justify-between gap-4 text-sm">
            <span>{item.title} × {item.quantity}</span>
            <span>{formatCents(item.unitPriceCents * item.quantity)}</span>
          </div>
        ))}
        <div className="p-4 flex justify-between font-medium">
          <span>Total paid</span>
          <span>{formatCents(order.grossCents)}</span>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="font-medium">Tracking</h2>
        {order.tracking.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">Tracking appears here when the supplier ships the order.</p>
        ) : (
          <ul className="mt-2 text-sm flex flex-col gap-2">
            {order.tracking.map(shipment => (
              <li key={shipment.number}>
                {shipment.carrier ? `${shipment.carrier} ` : ''}
                {shipment.url ? <a className="text-primary" href={shipment.url}>{shipment.number}</a> : shipment.number}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link href={`/store/${order.storeSlug}`} className="text-sm text-primary mt-8 inline-block">Back to store</Link>
    </StoreFrame>
  )
}
