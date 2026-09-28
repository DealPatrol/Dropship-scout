import Link from 'next/link'
import { Radar, ShoppingCart } from 'lucide-react'

export function StoreFrame({
  name,
  slug,
  children,
}: {
  name: string
  slug: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={`/store/${slug}`} className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shrink-0">
              <Radar className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="font-semibold truncate">{name}</span>
          </Link>
          <Link href={`/store/${slug}/cart`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ShoppingCart className="h-4 w-4" />
            Cart
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
