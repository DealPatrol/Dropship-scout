import { catalogQuoteAddress, supplierOrdersMode, type OrdersMode } from '@/lib/commerce/modes'
import { buildPrintifyOrderPayload } from '@/lib/commerce/payloads'
import type { PlaceOrderResult, RouteGroup, RouteOrderInput } from '@/lib/commerce/order-routing'
import { asArray, asRecord, supplierFetch, text, type FetchImpl } from './http'
import type { ImportedVariant, SupplierGateway } from './types'

const DEFAULT_BASE = 'https://api.printify.com/v1'

interface PrintifyOptions {
  fetchImpl?: FetchImpl
  mode?: OrdersMode
}

function apiToken(): string | undefined {
  return process.env.PRINTIFY_API_TOKEN
}

function shopId(): string | undefined {
  return process.env.PRINTIFY_SHOP_ID
}

function centsField(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(amount) || amount < 0) return null
  return amount
}

function shippingOptions(body: unknown): { id: number; cents: number }[] {
  const fromArray = asArray(body)
    .map(row => ({
      id: Number(asRecord(row)?.shipping ?? asRecord(row)?.id ?? 1),
      cents: centsField(asRecord(row)?.cost ?? asRecord(row)?.price),
    }))
    .filter((row): row is { id: number; cents: number } => Number.isInteger(row.id) && row.cents !== null)
  if (fromArray.length > 0) return fromArray.sort((a, b) => a.cents - b.cents)

  const record = asRecord(body)
  if (!record) return []
  const named: { id: number; cents: number }[] = []
  const standard = centsField(record.standard)
  const express = centsField(record.express)
  const priority = centsField(record.priority)
  if (standard !== null) named.push({ id: 1, cents: standard })
  if (express !== null) named.push({ id: 2, cents: express })
  if (priority !== null) named.push({ id: 3, cents: priority })
  return named.sort((a, b) => a.cents - b.cents)
}

export function createPrintifyGateway(options: PrintifyOptions = {}): SupplierGateway {
  const fetchImpl = options.fetchImpl ?? fetch
  const mode = () => options.mode ?? supplierOrdersMode()
  const root = () => (process.env.PRINTIFY_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, '')

  async function printify(path: string, init: RequestInit = {}) {
    const token = apiToken()
    if (!token || !shopId()) throw new Error('Printify is not configured.')
    return supplierFetch(fetchImpl, `${root()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'DropshipScout/1.0',
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  }

  function shopPath(path: string): string {
    return `/shops/${shopId()}${path}`
  }

  return {
    provider: 'printify',
    configured: () => Boolean(apiToken() && shopId()),
    missingConfiguration: () =>
      'Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID. Import uses products already created in that Printify shop.',
    async search(query: string): Promise<ImportedVariant[]> {
      const list = await printify(shopPath('/products.json?limit=10'))
      const products = asArray(asRecord(list.body)?.data).filter(product => {
        const title = text(asRecord(product)?.title).toLowerCase()
        return !query.trim() || title.includes(query.trim().toLowerCase())
      })
      const quote = catalogQuoteAddress()
      const imported: ImportedVariant[] = []

      for (const product of products.slice(0, 8)) {
        const record = asRecord(product)
        const productId = text(record?.id)
        if (!productId) continue
        const image = text(asRecord(asArray(record?.images)[0])?.src)
        for (const variant of asArray(record?.variants).slice(0, 6)) {
          const item = asRecord(variant)
          const variantId = item?.id
          const costCents = centsField(item?.cost)
          if (variantId === undefined || costCents === null || item?.is_enabled === false) continue
          const shipping = await printify(shopPath('/orders/shipping.json'), {
            method: 'POST',
            body: JSON.stringify({
              line_items: [{ product_id: productId, variant_id: variantId, quantity: 1 }],
              address_to: {
                first_name: 'Quote',
                last_name: 'Estimate',
                email: 'quote@dropshipscout.local',
                phone: '0000000000',
                country: quote.countryCode,
                region: quote.region,
                address1: quote.address1,
                city: quote.city,
                zip: quote.postalCode,
              },
            }),
          })
          const standard = shippingOptions(shipping.body)[0]
          if (!standard) continue
          const title = text(record?.title) || 'Printify product'
          const variantTitle = text(item?.title)
          imported.push({
            provider: 'printify',
            externalId: productId,
            variantId: String(variantId),
            title: variantTitle ? `${title} — ${variantTitle}` : title,
            description: text(record?.description) || title,
            imageUrl: image || undefined,
            costCents,
            shippingCents: standard.cents,
            sku: text(item?.sku) || undefined,
            stock: null,
            available: true,
          })
        }
      }
      return imported
    },
    async placeOrder(group: RouteGroup, input: RouteOrderInput): Promise<PlaceOrderResult> {
      if (!apiToken() || !shopId()) {
        return { status: 'error', reason: 'Printify is not configured. Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID.' }
      }
      const ordersMode = mode()
      try {
        const address = buildPrintifyOrderPayload({
          orderNumber: group.orderNumber,
          recipient: input.address,
          shippingMethod: 1,
          items: [],
        }).address_to
        const shippingQuote = await printify(shopPath('/orders/shipping.json'), {
          method: 'POST',
          body: JSON.stringify({
            line_items: group.items.map(item => ({
              product_id: item.productId,
              variant_id: Number(item.variantId),
              quantity: item.quantity,
            })),
            address_to: address,
          }),
        })
        const methods = shippingOptions(shippingQuote.body)
        const shippingMethod = methods[0]?.id || 1
        const payload = buildPrintifyOrderPayload({
          orderNumber: group.orderNumber,
          recipient: input.address,
          shippingMethod,
          items: group.items.map(item => ({
            productId: item.productId || '',
            variantId: Number(item.variantId),
            quantity: item.quantity,
          })),
        })
        const created = await printify(shopPath('/orders.json'), {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        const record = asRecord(created.body)
        const orderId = text(record?.id)
        if (!created.ok || !orderId) {
          const reason = text(record?.error) || text(record?.message) || `Printify rejected the order (${created.status})`
          return { status: 'rejected', reason, outOfStock: /stock|unavailable/i.test(reason) }
        }
        if (ordersMode === 'live') {
          const production = await printify(shopPath(`/orders/${orderId}/send_to_production.json`), { method: 'POST' })
          if (!production.ok) {
            return {
              status: 'rejected',
              reason: text(asRecord(production.body)?.error) || 'Printify accepted the draft but refused production.',
            }
          }
        }
        const productionCents = centsField(record?.total_price)
        const shippingCents = centsField(record?.total_shipping)
        return {
          status: 'accepted',
          externalOrderId: orderId,
          sandbox: ordersMode === 'sandbox',
          chargedCostCents: productionCents === null ? undefined : productionCents + (shippingCents ?? 0),
        }
      } catch (error) {
        return { status: 'error', reason: error instanceof Error ? error.message : 'Printify request failed' }
      }
    },
    async cancelOrder(_group, externalOrderId) {
      if (!apiToken() || !shopId()) return
      const response = await printify(shopPath(`/orders/${encodeURIComponent(externalOrderId)}/cancel.json`), {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error(text(asRecord(response.body)?.error) || `Printify could not cancel order ${externalOrderId}`)
      }
    },
    async tracking(externalOrderId: string) {
      if (!apiToken() || !shopId()) return null
      const detail = await printify(shopPath(`/orders/${encodeURIComponent(externalOrderId)}.json`))
      const shipment = asRecord(asArray(asRecord(detail.body)?.shipments)[0])
      const trackingNumber = text(shipment?.number) || text(shipment?.tracking_number)
      if (!trackingNumber) return null
      return {
        trackingNumber,
        trackingUrl: text(shipment?.url) || text(shipment?.tracking_url) || undefined,
        carrier: text(shipment?.carrier) || undefined,
      }
    },
  }
}
