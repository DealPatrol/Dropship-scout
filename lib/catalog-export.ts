import type { ListingRecord } from './store-db'

export type CatalogExportChannel = 'shopify' | 'etsy'
export type CatalogExportListing = Pick<ListingRecord,
  'id' | 'title' | 'description' | 'priceCents' | 'slug' | 'imageUrl' | 'supplierName'
> & { sku?: string | null; stock?: number | null }

export function parseCatalogExportChannel(value: string | null): CatalogExportChannel {
  if (value === null || value === 'shopify') return 'shopify'
  if (value === 'etsy') return 'etsy'
  throw new RangeError('Export channel must be shopify or etsy.')
}

/** Quote every cell; neutralize spreadsheet formulas even after whitespace. */
export function escapeCatalogCsvCell(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value)
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text)
    ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

function row(values: readonly (string | number | null | undefined)[]): string {
  return values.map(escapeCatalogCsvCell).join(',')
}

function knownStock(value: number | null | undefined): number | '' {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : ''
}

function safeImage(value: string | null): string {
  if (!value) return ''
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? value : ''
  } catch { return '' }
}

/** Plain canonical description becomes inert HTML for Shopify's Body column. */
function descriptionHtml(value: string | null): string {
  return (value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    .replace(/\r?\n/g, '<br>')
}

/**
 * Canonical listing export only: no external sync, fulfillment activation or
 * publication. Shopify rows are draft until the merchant reviews them. Etsy
 * rows are a worksheet: eligibility, taxonomy, currency and shipping profiles
 * require merchant review before creating Etsy listings.
 */
export function exportCatalogCsv(
  listings: readonly CatalogExportListing[],
  channel: CatalogExportChannel,
): { csv: string; filename: string } {
  if (channel !== 'shopify' && channel !== 'etsy') throw new RangeError('Export channel must be shopify or etsy.')
  for (const listing of listings) {
    if (!Number.isSafeInteger(listing.priceCents) || listing.priceCents < 0) {
      throw new RangeError('Listing price must be a nonnegative integer in cents.')
    }
  }
  if (channel === 'shopify') {
    const headers = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Published',
      'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price',
      'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy',
      'Variant Fulfillment Service', 'Image Src', 'Status']
    const rows = listings.map(listing => {
      // Include canonical ID so distinct listings never collapse into one handle.
      const handle = `scout-${listing.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const stock = knownStock(listing.stock)
      return row([handle, listing.title, descriptionHtml(listing.description), listing.supplierName,
        'FALSE', 'Title', 'Default Title', listing.sku, (listing.priceCents / 100).toFixed(2),
        stock === '' ? '' : 'shopify', stock, 'deny', 'manual', safeImage(listing.imageUrl), 'draft'])
    })
    return { csv: [row(headers), ...rows].join('\n') + '\n', filename: 'scout-shopify-draft-products.csv' }
  }
  const headers = ['Canonical Listing ID', 'Title', 'Description', 'Price', 'Currency (verify)',
    'SKU', 'Supplier Stock (blank = unknown)', 'Image URL', 'Supplier', 'Review Required']
  const rows = listings.map(listing => row([listing.id, listing.title, listing.description,
    (listing.priceCents / 100).toFixed(2), 'USD', listing.sku, knownStock(listing.stock),
    safeImage(listing.imageUrl), listing.supplierName,
    'Worksheet only; verify Etsy eligibility, taxonomy, stock, currency and shipping before publishing.']))
  return { csv: [row(headers), ...rows].join('\n') + '\n', filename: 'scout-etsy-listing-worksheet.csv' }
}
