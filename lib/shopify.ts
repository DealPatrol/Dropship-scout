const SHOPIFY_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i

export interface ShopifyConnectionResult {
  valid: boolean
  domain?: string
  shopName?: string
  plan?: string | null
  currency?: string | null
  error?: string
}

export function normalizeShopifyDomain(value: string): string {
  const trimmed = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return trimmed.endsWith('.myshopify.com') ? trimmed : `${trimmed}.myshopify.com`
}

export function shopifyApiVersion(): string {
  return process.env.SHOPIFY_API_VERSION || '2026-07'
}

export async function validateShopifyConnection(
  domainInput: string,
  token: string
): Promise<ShopifyConnectionResult> {
  const domain = normalizeShopifyDomain(domainInput)
  if (!SHOPIFY_DOMAIN_PATTERN.test(domain)) {
    return { valid: false, error: 'Domain must be in format: your-store.myshopify.com' }
  }
  if (!token.trim()) {
    return { valid: false, error: 'Shopify access token is required' }
  }

  try {
    const response = await fetch(
      `https://${domain}/admin/api/${shopifyApiVersion()}/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': token,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }
    )

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid token or missing Admin API permissions' }
    }
    if (!response.ok) {
      return { valid: false, error: `Shopify connection failed with HTTP ${response.status}` }
    }

    const body = await response.json()
    return {
      valid: true,
      domain,
      shopName: body.shop?.name || domain,
      plan: body.shop?.plan_name || null,
      currency: body.shop?.currency || null,
    }
  } catch {
    return { valid: false, error: 'Could not connect to Shopify' }
  }
}

export function shopifyErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as { errors: unknown }).errors
    if (typeof errors === 'string') return errors
    return JSON.stringify(errors)
  }
  return `Shopify returned HTTP ${status}`
}
