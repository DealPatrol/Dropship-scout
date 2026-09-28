'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { addToCart } from '@/lib/storefront-cart'

export function AddToCartButton({
  slug,
  listingId,
  title,
  priceCents,
  shippingCents,
  imageUrl,
  buyNow = false,
}: {
  slug: string
  listingId: string
  title: string
  priceCents: number
  shippingCents: number
  imageUrl?: string | null
  buyNow?: boolean
}) {
  const router = useRouter()
  const [added, setAdded] = useState(false)

  function add() {
    addToCart(slug, {
      listingId,
      quantity: 1,
      title,
      priceCents,
      shippingCents,
      imageUrl: imageUrl ?? undefined,
    })
    if (buyNow) {
      router.push(`/store/${slug}/checkout`)
      return
    }
    setAdded(true)
  }

  return (
    <Button onClick={add} variant={buyNow ? 'default' : 'outline'}>
      {buyNow ? 'Buy now' : added ? 'Added to cart' : 'Add to cart'}
    </Button>
  )
}
