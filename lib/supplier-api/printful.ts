import { dollarsToCents } from '@/lib/commerce/money'
import { catalogQuoteAddress, supplierOrdersMode, type OrdersMode } from '@/lib/commerce/modes'
import { buildPrintfulOrderPayload } from '@/lib/commerce/payloads'
import type { PlaceOrderResult, RouteGroup, RouteOrderInput } from '@/lib/commerce/order-routing'
import { asArray, asRecord, supplierFetch, text, type FetchImpl } from './http'
import type { ImportedVariant, SupplierGateway } from './types'

const DEFAULT_BASE = 'https://api.printful.com'

interface PrintfulOptions {
  fetchImpl?: FetchImpl
  mode?: OrdersMode
}

function apiToken(): string | undefined {
  return process.env.PRINTFUL_API_TOKEN
}

function storeId(): string | undefined {
  return process.env.PRINTFUL_STORE_ID
}

function errorText(body: unknown, fallback: string): string {
  const record = asRecord(body)
  const nested = asRecord(record?.error)
  return text(record?.error) || text(nested?.message) || text(record?.result) || fallback
}

export function createPrintfulGateway(options: PrintfulOptions = {}): SupplierGateway {
  const fetchImpl = options.fetchImpl ?? fetch
  const mode = () => options.mode ?? supplierOrdersMode()
  const root = () => (process.env.PRINTFUL_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, '')

  async function printful(path: string, init: RequestInit = {}) {
    const token = apiToken()
    const store = storeId()
    if (!token || !store) throw new Error('Printful is not configured.')
    return supplierFetch(fetchImpl, `${root()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-PF-Store-Id': store,
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  }

  return {
    provider: 'printful',
    configured: () => Boolean(apiToken() && storeId()),
    missingConfiguration: () =>
      'Set PRINTFUL_API_TOKEN and PRINTFUL_STORE_ID. Import uses sync products already created in that Printful store.',
    async search(query: string): Promise<ImportedVariant[]> {
      const list = await printful('/store/products')
      const products = asArray(asRecord(list.body)?.result).filter(product => {
        const name = text(asRecord(product)?.name).toLowerCase()
        return !query.trim() || name.includes(query.trim().toLowerCase())
      })
      const quote = catalogQuoteAddress()
      const imported: ImportedVariant[] = []

      for (const product of products.slice(0, 8)) {
        const summary = asRecord(product)
        const id = summary?.id
        if (id === undefined) continue
        const detail = await printful(`/store/products/${id}`)
        const detailResult = asRecord(asRecord(detail.body)?.result)
        const syncProduct = asRecord(detailResult?.sync_product)
        for (const variant of asArray(detailResult?.sync_variants).slice(0, 6)) {
          const item = asRecord(variant)
          const syncVariantId = item?.id
          const catalogVariantId = item?.variant_id
          if (syncVariantId === undefined || catalogVariantId === undefined) continue
          const catalog = await printful(`/products/variant/${catalogVariantId}`)
          const catalogVariant = asRecord(asRecord(asRecord(catalog.body)?.result)?.variant)
          const costCents = dollarsToCents(catalogVariant?.price)
          if (costCents === null) continue
          const rates = await printful('/shipping/rates', {
            method: 'POST',
            body: JSON.stringify({
              recipient: {
                address1: quote.address1,
                city: quote.city,
                country_code: quote.countryCode,
                state_code: quote.region,
                zip: quote.postalCode,
              },
              items: [{ variant_id: catalogVariantId, quantity: 1 }],
            }),
          })
          const rate = asArray(asRecord(rates.body)?.result)
            .map(row => dollarsToCents(asRecord(row)?.rate))
            .filter((cents): cents is number => cents !== null)
            .sort((a, b) => a - b)[0]
          if (rate === undefined) continue
          const productImage = asRecord(item?.product)
          const name = text(item?.name) || text(syncProduct?.name) || 'Printful product'
          imported.push({
            provider: 'printful',
            externalId: String(id),
            variantId: String(syncVariantId),
            title: name,
            description: text(syncProduct?.name) || name,
            imageUrl: text(productImage?.image) || text(summary?.thumbnail_url) || undefined,
            costCents,
            shippingCents: rate,
            sku: text(item?.sku) || undefined,
            stock: null,
            available: item?.synced !== false,
          })
        }
      }
      return imported
    },
    async placeOrder(group: RouteGroup, input: RouteOrderInput): Promise<PlaceOrderResult> {
      if (!apiToken() || !storeId()) {
        return { status: 'error', reason: 'Printful is not configured. Set PRINTFUL_API_TOKEN and PRINTFUL_STORE_ID.' }
      }
      const ordersMode = mode()
      try {
        const payload = buildPrintfulOrderPayload({
          orderNumber: group.orderNumber,
          mode: ordersMode,
          recipient: input.address,
          items: group.items.map(item => ({
            syncVariantId: Number(item.variantId),
            quantity: item.quantity,
          })),
        })
        const created = await printful('/orders', { method: 'POST', body: JSON.stringify(payload) })
        const result = asRecord(asRecord(created.body)?.result)
        if (!created.ok || result?.id === undefined) {
          const reason = errorText(created.body, `Printful rejected the order (${created.status})`)
          return { status: 'rejected', reason, outOfStock: /stock|unavailable|discontinued/i.test(reason) }
        }
        const total = dollarsToCents(asRecord(result.costs)?.total)
        return {
          status: 'accepted',
          externalOrderId: String(result.id),
          sandbox: ordersMode === 'sandbox',
          chargedCostCents: total ?? undefined,
        }
      } catch (error) {
        return { status: 'error', reason: error instanceof Error ? error.message : 'Printful request failed' }
      }
    },
    async cancelOrder(_group, externalOrderId) {
      if (!apiToken() || !storeId()) return
      const response = await printful(`/orders/${encodeURIComponent(externalOrderId)}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(errorText(response.body, `Printful could not cancel order ${externalOrderId}`))
      }
    },
    async tracking(externalOrderId: string) {
      if (!apiToken() || !storeId()) return null
      const detail = await printful(`/orders/${encodeURIComponent(externalOrderId)}`)
      const shipment = asRecord(asArray(asRecord(asRecord(detail.body)?.result)?.shipments)[0])
      const trackingNumber = text(shipment?.tracking_number)
      if (!trackingNumber) return null
      return {
        trackingNumber,
        trackingUrl: text(shipment?.tracking_url) || undefined,
        carrier: text(shipment?.carrier) || text(shipment?.service) || undefined,
      }
    },
  }
}
