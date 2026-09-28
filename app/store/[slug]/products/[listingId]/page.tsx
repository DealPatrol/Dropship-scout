import Image from 'next/image'
import { notFound } from 'next/navigation'
import { AddToCartButton } from '@/components/storefront/add-to-cart-button'
import { StoreFrame } from '@/components/storefront/store-frame'
import { formatCents } from '@/lib/commerce/money'
import { getPublishedListing } from '@/lib/store-db'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { slug: string; listingId: string } }) {
  const listing = await getPublishedListing(params.slug, params.listingId)
  if (!listing) notFound()

  return (
    <StoreFrame name={listing.storeName} slug={listing.storeSlug}>
      <div className="grid gap-8 md:grid-cols-2">
        {listing.imageUrl ? (
          <div className="relative aspect-square rounded-lg border border-border bg-secondary overflow-hidden">
            <Image src={listing.imageUrl} alt="" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-secondary min-h-64" />
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{listing.provider === 'direct' ? listing.supplierName || 'Direct supplier' : listing.provider}</p>
          <h1 className="text-3xl font-semibold mt-2">{listing.title}</h1>
          <p className="text-2xl mt-4">{formatCents(listing.priceCents)}</p>
          <p className="text-sm text-muted-foreground mt-1">Shipping {formatCents(listing.shippingCents)} calculated from the supplier quote.</p>
          {listing.description && <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{listing.description}</p>}
          <div className="mt-8 flex gap-3">
            <AddToCartButton
              slug={listing.storeSlug}
              listingId={listing.id}
              title={listing.title}
              priceCents={listing.priceCents}
              shippingCents={listing.shippingCents}
              imageUrl={listing.imageUrl}
            />
            <AddToCartButton
              buyNow
              slug={listing.storeSlug}
              listingId={listing.id}
              title={listing.title}
              priceCents={listing.priceCents}
              shippingCents={listing.shippingCents}
              imageUrl={listing.imageUrl}
            />
          </div>
        </div>
      </div>
    </StoreFrame>
  )
}
