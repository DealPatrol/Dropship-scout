import type { CatalogProduct, NicheId } from '@/lib/merchandising/types'
import type {
  SupplierDataAdapter,
  SupplierProductResult,
  SupplierProductSearch,
} from './types'

const DEFAULT_CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1'

interface CjProduct {
  pid?: string
  productNameEn?: string
  productImage?: string
  sellPrice?: number | string
  categoryName?: string
}

interface CjListResponse {
  result?: boolean
  message?: string
  data?: {
    content?: CjProduct[]
    totalRecords?: number
  }
}

function mapNiche(category: string): NicheId {
  const normalized = category.toLowerCase()
  if (normalized.includes('pet')) return 'pets'
  if (normalized.includes('beaut')) return 'beauty'
  if (normalized.includes('sport') || normalized.includes('fitness')) return 'fitness'
  if (normalized.includes('car') || normalized.includes('auto')) return 'automotive'
  if (normalized.includes('baby') || normalized.includes('kid')) return 'baby'
  if (normalized.includes('electronic') || normalized.includes('phone')) return 'electronics'
  if (normalized.includes('outdoor') || normalized.includes('garden')) return 'outdoor'
  if (normalized.includes('office')) return 'office'
  if (normalized.includes('fashion') || normalized.includes('clothing')) return 'fashion'
  return 'home'
}

function toCatalogProduct(product: CjProduct, index: number): CatalogProduct {
  const cost = Number(product.sellPrice ?? 0)
  const name = product.productNameEn?.trim() || 'Unnamed CJ product'
  const category = product.categoryName?.trim() || 'General'

  return {
    id: `cj-${product.pid || index}`,
    name,
    niches: [mapNiche(category)],
    cost,
    price: Number((cost * 2).toFixed(2)),
    monthlyOrders: 0,
    rating: 0,
    competition: 'Medium',
    shippingDays: 12,
    supplierCount: 1,
    suppliers: ['cjdropship'],
    trend: 'stable',
    demand: 0,
    trendStability: 0,
    seasonality: 'evergreen',
    peakMonths: [],
    holidays: [],
    audience: 'Validate audience and demand before listing',
    adPlatform: 'Unverified',
    impulse: false,
    recurring: false,
    bundleWith: [],
    tags: ['live supplier data', category],
  }
}

export class CjDropshippingAdapter implements SupplierDataAdapter {
  private readonly accessToken = process.env.CJ_API_ACCESS_TOKEN
  private readonly baseUrl = process.env.CJ_API_BASE_URL || DEFAULT_CJ_API_URL

  readonly source = {
    id: 'cj' as const,
    label: 'CJ Dropshipping',
    kind: 'live' as const,
    configured: Boolean(process.env.CJ_API_ACCESS_TOKEN),
    description: 'Live CJ product records. Demand, rating, and competition remain unverified.',
  }

  async search(input: SupplierProductSearch): Promise<SupplierProductResult> {
    if (!this.accessToken) {
      throw new Error('CJ Dropshipping is not configured. Set CJ_API_ACCESS_TOKEN.')
    }

    const page = Math.max(input.page ?? 1, 1)
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100)
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/product/list`)
    url.searchParams.set('pageNum', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    if (input.query?.trim()) url.searchParams.set('productNameEn', input.query.trim())

    const response = await fetch(url, {
      headers: {
        'CJ-Access-Token': this.accessToken,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
    const body = (await response.json().catch(() => ({}))) as CjListResponse

    if (!response.ok || body.result === false) {
      throw new Error(body.message || `CJ Dropshipping returned HTTP ${response.status}`)
    }

    const products = (body.data?.content ?? []).map(toCatalogProduct)
    return {
      source: this.source.id,
      products,
      total: body.data?.totalRecords ?? products.length,
    }
  }
}
