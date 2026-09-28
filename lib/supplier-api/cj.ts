import { dollarsToCents } from '@/lib/commerce/money'
import type { OrdersMode } from '@/lib/commerce/modes'
import { supplierOrdersMode } from '@/lib/commerce/modes'
import { buildCjOrderPayload } from '@/lib/commerce/payloads'
import type { PlaceOrderResult, RouteGroup, RouteOrderInput } from '@/lib/commerce/order-routing'
import { asArray, asRecord, supplierFetch, text, type FetchImpl } from './http'
import type { ImportedVariant, SupplierGateway } from './types'

const DEFAULT_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

interface CjOptions {
  fetchImpl?: FetchImpl
  mode?: OrdersMode
}

function baseUrl(): string {
  return (process.env.CJ_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, '')
}

function token(): string | undefined {
  return process.env.CJ_API_ACCESS_TOKEN
}

function messageOf(body: unknown, fallback: string): string {
  const record = asRecord(body)
  return text(record?.message) || fallback
}

function rowsFrom(body: unknown): unknown[] {
  const data = asRecord(body)?.data
  const record = asRecord(data)
  if (record) return asArray(record.content ?? record.list ?? record.variants ?? record.variantList)
  return asArray(data)
}

function cheapestFreight(body: unknown): { name: string; cents: number } | null {
  const options = rowsFrom(body)
    .map(row => {
      const record = asRecord(row)
      if (!record) return null
      const name = text(record.logisticName) || text(record.logisticsName)
      const cents = dollarsToCents(record.logisticPrice ?? record.postage ?? record.price)
      if (!name || cents === null) return null
      return { name, cents }
    })
    .filter((row): row is { name: string; cents: number } => row !== null)
    .sort((a, b) => a.cents - b.cents)
  return options[0] ?? null
}

export function createCjGateway(options: CjOptions = {}): SupplierGateway {
  const fetchImpl = options.fetchImpl ?? fetch
  const mode = () => options.mode ?? supplierOrdersMode()

  async function cj(path: string, init: RequestInit = {}) {
    const accessToken = token()
    if (!accessToken) throw new Error('CJ Dropshipping is not configured.')
    const url = path.startsWith('http') ? path : `${baseUrl()}${path}`
    return supplierFetch(fetchImpl, url, {
      ...init,
      headers: {
        'CJ-Access-Token': accessToken,
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  }

  return {
    provider: 'cj',
    configured: () => Boolean(token()),
    missingConfiguration: () => 'Set CJ_API_ACCESS_TOKEN to import CJ Dropshipping products.',
    async search(query: string): Promise<ImportedVariant[]> {
      const params = new URLSearchParams({ pageNum: '1', pageSize: '10' })
      if (query.trim()) params.set('productNameEn', query.trim())
      const list = await cj(`/product/list?${params.toString()}`)
      if (!list.ok || asRecord(list.body)?.result === false) {
        throw new Error(messageOf(list.body, `CJ product search failed (${list.status})`))
      }

      const imported: ImportedVariant[] = []
      for (const product of rowsFrom(list.body).slice(0, 8)) {
        const record = asRecord(product)
        const pid = text(record?.pid) || text(record?.id)
        if (!pid) continue
        const variants = await cj(`/product/variant/query?pid=${encodeURIComponent(pid)}`)
        if (!variants.ok || asRecord(variants.body)?.result === false) continue
        const productName = text(record?.productNameEn) || 'CJ product'
        const description = text(record?.productNameEn) || text(record?.remark)
        const image = text(record?.productImage)

        for (const variant of rowsFrom(variants.body).slice(0, 4)) {
          const item = asRecord(variant)
          const vid = text(item?.vid)
          const costCents = dollarsToCents(item?.variantSellPrice ?? item?.sellPrice)
          if (!vid || costCents === null) continue
          const freight = await cj('/logistic/freightCalculate', {
            method: 'POST',
            body: JSON.stringify({
              startCountryCode: 'CN',
              endCountryCode: process.env.QUOTE_COUNTRY || 'US',
              products: [{ vid, quantity: 1 }],
            }),
          })
          const quote = freight.ok ? cheapestFreight(freight.body) : null
          if (!quote) continue

          let stock: number | null = null
          const stockResponse = await cj(`/product/stock/queryByVid?vid=${encodeURIComponent(vid)}`)
          if (stockResponse.ok && asRecord(stockResponse.body)?.result !== false) {
            stock = rowsFrom(stockResponse.body).reduce<number>((sum, row) => {
              const entry = asRecord(row)
              const amount = Number(entry?.totalInventory ?? entry?.storageNum ?? entry?.quantity ?? 0)
              return sum + (Number.isFinite(amount) ? amount : 0)
            }, 0)
          }

          imported.push({
            provider: 'cj',
            externalId: pid,
            variantId: vid,
            title: `${productName}${text(item?.variantNameEn) ? ` — ${text(item?.variantNameEn)}` : ''}`,
            description,
            imageUrl: text(item?.variantImage) || image || undefined,
            costCents,
            shippingCents: quote.cents,
            sku: text(item?.variantSku) || undefined,
            stock,
            available: stock === null || stock > 0,
          })
        }
      }
      return imported
    },
    async placeOrder(group: RouteGroup, input: RouteOrderInput): Promise<PlaceOrderResult> {
      if (!token()) {
        return { status: 'error', reason: 'CJ Dropshipping is not configured. Set CJ_API_ACCESS_TOKEN.' }
      }
      const ordersMode = mode()
      try {
        for (const item of group.items) {
          const stockResponse = await cj(`/product/stock/queryByVid?vid=${encodeURIComponent(item.variantId)}`)
          if (stockResponse.ok && asRecord(stockResponse.body)?.result !== false) {
            const available = rowsFrom(stockResponse.body).reduce<number>((sum, row) => {
              const entry = asRecord(row)
              const amount = Number(entry?.totalInventory ?? entry?.storageNum ?? 0)
              return sum + (Number.isFinite(amount) ? amount : 0)
            }, 0)
            if (rowsFrom(stockResponse.body).length > 0 && available < item.quantity) {
              return { status: 'rejected', outOfStock: true, reason: `${item.title} is out of stock at CJ.` }
            }
          }
        }

        const freight = await cj('/logistic/freightCalculate', {
          method: 'POST',
          body: JSON.stringify({
            startCountryCode: 'CN',
            endCountryCode: input.address.countryCode,
            products: group.items.map(item => ({ vid: item.variantId, quantity: item.quantity })),
          }),
        })
        const quote = freight.ok ? cheapestFreight(freight.body) : null
        const logisticName = quote?.name || 'CJPacket Ordinary'
        const payload = buildCjOrderPayload({
          orderNumber: group.orderNumber,
          mode: ordersMode,
          recipient: input.address,
          logisticName,
          items: group.items.map(item => ({
            vid: item.variantId,
            quantity: item.quantity,
            storeLineItemId: item.storeLineItemId,
          })),
        })
        const created = await cj('/shopping/order/createOrderV3', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        const record = asRecord(created.body)
        const data = asRecord(record?.data)
        if (!created.ok || record?.result === false || !text(data?.orderId)) {
          const reason = messageOf(created.body, `CJ rejected the order (${created.status})`)
          const outOfStock = /stock|inventory|unavailable/i.test(reason)
          return { status: 'rejected', reason, outOfStock }
        }
        const productCents = dollarsToCents(data?.productAmount) ?? 0
        const postageCents = dollarsToCents(data?.postageAmount) ?? quote?.cents ?? 0
        const actualCents = dollarsToCents(data?.actualPayment ?? data?.orderAmount)
        return {
          status: 'accepted',
          externalOrderId: text(data?.orderId),
          sandbox: ordersMode === 'sandbox',
          chargedCostCents: actualCents ?? productCents + postageCents,
        }
      } catch (error) {
        return { status: 'error', reason: error instanceof Error ? error.message : 'CJ request failed' }
      }
    },
    async cancelOrder(_group: RouteGroup, externalOrderId: string) {
      if (!token()) return
      await cj('/shopping/order/deleteOrder', {
        method: 'POST',
        body: JSON.stringify({ orderId: externalOrderId }),
      })
    },
    async tracking(externalOrderId: string) {
      if (!token()) return null
      const detail = await cj(`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(externalOrderId)}`)
      const data = asRecord(asRecord(detail.body)?.data)
      const trackingNumber = text(data?.trackNumber) || text(data?.trackingNumber)
      if (!trackingNumber) return null
      return {
        trackingNumber,
        trackingUrl: text(data?.trackingUrl) || undefined,
        carrier: text(data?.logisticName) || undefined,
      }
    },
  }
}
