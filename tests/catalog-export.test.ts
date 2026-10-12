import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { escapeCatalogCsvCell, exportCatalogCsv, parseCatalogExportChannel,
  type CatalogExportListing } from '../lib/catalog-export'

const mocks = vi.hoisted(() => ({ session: vi.fn(), listings: vi.fn(), product: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getSession: mocks.session }))
vi.mock('@/lib/store-db', () => ({ listSellerListings: mocks.listings, getSupplierProduct: mocks.product }))
import { GET } from '../app/api/store/export/route'

const listing: CatalogExportListing = { id: 'abc-123', title: 'Example, "item"',
  description: '<script>alert(1)</script>\nSecond line', priceCents: 2499,
  slug: 'example', imageUrl: 'https://example.com/image.jpg', supplierName: 'Supplier',
  sku: 'SKU-123', stock: 7 }

describe('catalog CSV export', () => {
  it('validates channel and defaults to Shopify', () => {
    expect(parseCatalogExportChannel(null)).toBe('shopify')
    expect(parseCatalogExportChannel('etsy')).toBe('etsy')
    for (const value of ['', 'woocommerce', '../secret', 'Shopify']) {
      expect(() => parseCatalogExportChannel(value)).toThrow(RangeError)
    }
  })

  it('escapes commas, quotes and multiline content as one quoted cell', () => {
    expect(escapeCatalogCsvCell('A,"B"\nC')).toBe('"A,""B""\nC"')
    expect(escapeCatalogCsvCell(null)).toBe('""')
  })

  it.each(['=SUM(A1)', '+cmd', '-1+2', '@SUM(A1)', '  =HYPERLINK("x")', '\t=cmd', '\r=cmd', '\n=cmd'])('neutralizes spreadsheet formula %s', value => {
    expect(escapeCatalogCsvCell(value).startsWith('"\'')).toBe(true)
  })

  it('exports cents accurately and keeps Shopify products draft with inert descriptions', () => {
    const result = exportCatalogCsv([listing], 'shopify')
    expect(result.filename).toBe('scout-shopify-draft-products.csv')
    expect(result.csv).toContain('"Variant Price"')
    expect(result.csv).toContain('"24.99"')
    expect(result.csv).toContain('"shopify","7","deny","manual"')
    expect(result.csv).toContain('"FALSE"')
    expect(result.csv).toContain('"draft"')
    expect(result.csv).toContain('&lt;script&gt;')
    expect(result.csv).not.toContain('<script>')
  })

  it('leaves unknown stock blank, without inventing zero or unlimited inventory', () => {
    for (const stock of [null, undefined, NaN, -2, 1.5]) {
      const result = exportCatalogCsv([{ ...listing, stock }], 'shopify')
      expect(result.csv).toContain('"24.99","","","deny"')
    }
    expect(exportCatalogCsv([{ ...listing, stock: 0 }], 'shopify').csv).toContain('"shopify","0"')
  })

  it('labels Etsy as a worksheet and preserves unknown inventory', () => {
    const result = exportCatalogCsv([{ ...listing, stock: null }], 'etsy')
    expect(result.filename).toContain('worksheet')
    expect(result.csv).toContain('Worksheet only; verify Etsy eligibility')
    expect(result.csv).toContain('"SKU-123","","https://example.com/image.jpg"')
  })

  it('rejects invalid prices and channel at runtime', () => {
    for (const priceCents of [-1, NaN, Infinity, 1.5]) {
      expect(() => exportCatalogCsv([{ ...listing, priceCents }], 'shopify')).toThrow(RangeError)
    }
    expect(() => exportCatalogCsv([], 'unknown' as 'shopify')).toThrow(RangeError)
  })

  it('omits unsafe image URLs and exports only selected public catalog fields', () => {
    const result = exportCatalogCsv([{ ...listing, imageUrl: 'javascript:alert(1)',
      supplierAccountId: 'acct_SECRET' } as CatalogExportListing], 'etsy')
    expect(result.csv).not.toContain('javascript:')
    expect(result.csv).not.toContain('acct_SECRET')
  })
})

describe('authenticated export route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({ id: 'merchant-1' })
    mocks.listings.mockResolvedValue([{ ...listing, sellerUserId: 'merchant-1', supplierProductId: 'supplier-product-1' }])
    mocks.product.mockResolvedValue({ sku: 'REAL-SKU', stock: null })
  })

  it('requires a session before reading merchant data', async () => {
    mocks.session.mockResolvedValue(null)
    const response = await GET(new NextRequest('https://example.com/api/store/export'))
    expect(response.status).toBe(401)
    expect(mocks.listings).not.toHaveBeenCalled()
  })

  it('rejects an unsupported channel before reading listings', async () => {
    const response = await GET(new NextRequest('https://example.com/api/store/export?channel=invalid'))
    expect(response.status).toBe(400)
    expect(mocks.listings).not.toHaveBeenCalled()
  })

  it('uses session ownership, safe filename and private uncached downloads', async () => {
    const response = await GET(new NextRequest('https://example.com/api/store/export?channel=etsy&sellerUserId=someone-else'))
    expect(mocks.listings).toHaveBeenCalledWith('merchant-1')
    expect(mocks.product).toHaveBeenCalledWith('supplier-product-1')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="scout-etsy-listing-worksheet.csv"')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.text()).toContain('"REAL-SKU",""')
  })

  it('does not expose database errors or secret values', async () => {
    mocks.listings.mockRejectedValue(new Error('postgres://secret:password@example.com'))
    const response = await GET(new NextRequest('https://example.com/api/store/export'))
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('password')
  })
})
