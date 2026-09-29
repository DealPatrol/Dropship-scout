import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StoreFrame } from '@/components/storefront/store-frame'
import { formatCents } from '@/lib/commerce/money'
import { metadataTitle, storeShouldIndex } from '@/lib/seo'
import { getPublishedStore } from '@/lib/store-db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = await getPublishedStore(params.slug)
  if (!store) return { title: 'Store', robots: { index: false, follow: false } }
  const description = 'Products are fulfilled by the connected supplier after checkout.'
  return {
    title: metadataTitle(store.storeName),
    description,
    alternates: { canonical: `/store/${store.storeSlug}` },
    robots: storeShouldIndex(store.storeSlug, store.listings.length)
      ? { index: true, follow: true }
      : { index: false, follow: false },
  }
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const store = await getPublishedStore(params.slug)
  if (!store) notFound()

  return (
    <StoreFrame name={store.storeName} slug={store.storeSlug}>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-primary">Store</p>
        <h1 className="text-3xl font-semibold mt-1">{store.storeName}</h1>
        <p className="text-sm text-muted-foreground mt-2">Products are fulfilled by the connected supplier after checkout.</p>
      </div>
      {store.listings.length === 0 ? (
        <p className="text-muted-foreground">No products are published yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {store.listings.map(listing => (
            <Link key={listing.id} href={`/store/${store.storeSlug}/products/${listing.id}`} className="rounded-lg border border-border overflow-hidden hover:border-primary/40">
              {listing.imageUrl ? (
                <div className="relative h-44 bg-secondary">
                  <Image src={listing.imageUrl} alt="" fill className="object-cover" sizes="(min-width: 1024px) 320px, 100vw" />
                </div>
              ) : (
                <div className="h-44 bg-secondary" />
              )}
              <div className="p-4">
                <h2 className="font-medium">{listing.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{formatCents(listing.priceCents)}</p>
                <p className="text-xs text-muted-foreground mt-2">Shipping {formatCents(listing.shippingCents)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </StoreFrame>
  )
}
