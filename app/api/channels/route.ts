import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { SALES_CHANNELS } from '@/lib/channels/directory'
import { channelOrderPauseReason } from '@/lib/channels/sync'
import { getWooUrl } from '@/lib/channel-db'
import { getShopifyDomain } from '@/lib/db'
import { getStoreProfile } from '@/lib/store-db'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [shopifyDomain, wooUrl, store] = await Promise.all([
    getShopifyDomain(user.id),
    getWooUrl(user.id),
    getStoreProfile(user.id),
  ])
  return NextResponse.json({
    channels: SALES_CHANNELS,
    connections: {
      hosted: {
        slug: store?.storeSlug ?? null,
        published: Boolean(store?.storePublished),
      },
      shopify: { domain: shopifyDomain },
      woocommerce: { url: wooUrl },
    },
    pauseReason: channelOrderPauseReason(),
  })
}
