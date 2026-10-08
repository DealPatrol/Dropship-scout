import Link from 'next/link'
import { Radar } from 'lucide-react'
import { SignupLink } from '@/components/marketing/signup-link'
import { Button } from '@/components/ui/button'

const links = [
  { href: '/research', label: 'Research' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: '/guides', label: 'Guides' },
]

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 pointer-events-none" />
      <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Radar className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="font-semibold">Dropship Scout</span>
          </Link>
          <nav aria-label="Primary" className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            {links.map(link => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">{link.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <SignupLink href="/auth/sign-up" location="header"><Button size="sm">Get started free</Button></SignupLink>
          </div>
        </div>
        <nav aria-label="Mobile" className="md:hidden border-t border-border px-4 py-2 flex gap-4 text-sm text-muted-foreground">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">{link.label}</Link>
          ))}
        </nav>
      </header>
      <main id="main" className="relative z-10">{children}</main>
      <footer className="relative z-10 border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-medium">Dropship Scout</p>
            <p className="text-sm text-muted-foreground mt-2">Product research for dropshipping, with a hosted store when a supplier can fulfill the order.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/research" className="text-muted-foreground hover:text-foreground">Research</Link>
            <Link href="/research/preview" className="text-muted-foreground hover:text-foreground">Free preview</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link>
            <Link href="/guides" className="text-muted-foreground hover:text-foreground">Guides</Link>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/research/winning-dropshipping-products" className="text-muted-foreground hover:text-foreground">Winning dropshipping products</Link>
            <Link href="/research/dropshipping-product-research-tool" className="text-muted-foreground hover:text-foreground">Product research tool</Link>
            <Link href="/research/shopify-product-research" className="text-muted-foreground hover:text-foreground">Shopify product research</Link>
            <Link href="/research/tiktok-trending-products-to-sell" className="text-muted-foreground hover:text-foreground">TikTok products to sell</Link>
            <SignupLink href="/auth/sign-up" location="footer" className="text-muted-foreground hover:text-foreground">Create an account</SignupLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
