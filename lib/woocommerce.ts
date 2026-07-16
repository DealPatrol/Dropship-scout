// WooCommerce API integration
import crypto from 'crypto'

export interface WooCommerceConfig {
  url: string
  consumerKey: string
  consumerSecret: string
}

export class WooCommerceAPI {
  private config: WooCommerceConfig

  constructor(config: WooCommerceConfig) {
    this.config = config
  }

  private generateOAuthSignature(
    method: string,
    url: string,
    params: Record<string, string>
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc: Record<string, string>, key) => {
        acc[key] = params[key]
        return acc
      }, {})

    const paramString = Object.entries(sortedParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
      paramString
    )}`
    const signingKey = `${encodeURIComponent(this.config.consumerSecret)}&`

    return crypto.createHmac('sha256', signingKey).update(baseString).digest('base64')
  }

  async request(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = Math.random().toString(36).substring(2, 15)

    const url = `${this.config.url}/wp-json/wc/v3${endpoint}`

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp.toString(),
      oauth_version: '1.0',
    }

    const signature = this.generateOAuthSignature(method, url, oauthParams)
    oauthParams.oauth_signature = signature

    const authHeader = Object.entries(oauthParams)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ')

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `OAuth ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getOrders(): Promise<any[]> {
    return this.request('GET', '/orders')
  }

  async getOrder(orderId: string): Promise<any> {
    return this.request('GET', `/orders/${orderId}`)
  }

  async getProducts(limit: number = 100): Promise<any[]> {
    return this.request('GET', `/products?per_page=${limit}`)
  }

  async updateOrder(orderId: string, data: Record<string, any>): Promise<any> {
    return this.request('PUT', `/orders/${orderId}`, data)
  }
}

export function validateWooCommerceUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return true
  } catch {
    return false
  }
}
