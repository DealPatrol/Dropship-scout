import Link from 'next/link'
import { Radar } from 'lucide-react'
import { SignupLink } from '@/components/marketing/signup-link'
import { WatchForm } from '@/components/marketing/watch-form'
import { Button } from '@/components/ui/button'
import { SUPPORT_EMAIL } from '@/lib/site'

const links = [
  { href: '/research', label: 'Research' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
]

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 pointer-events-none" />
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Radar className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">Dropship Scout</span>
          </Link>
          <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {links.map(link => (
              <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <SignupLink href="/auth/sign-up" location="header"><Button size="sm">Start free</Button></SignupLink>
          </div>
        </div>
        <nav aria-label="Mobile" className="md:hidden border-t border-border px-4 py-2 flex gap-4 overflow-x-auto text-sm text-muted-foreground">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">{link.label}</Link>
          ))}
        </nav>
      </header>
      <main id="main" className="relative z-10">{children}</main>
      <footer className="relative z-10 border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-medium">Dropship Scout</p>
            <p className="text-sm text-muted-foreground mt-2">Product research for dropshipping, with a hosted store when a supplier can fulfill the order.</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 inline-block text-sm text-primary hover:underline">{SUPPORT_EMAIL}</a>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/research" className="text-muted-foreground hover:text-foreground">Research</Link>
            <Link href="/research/idea-checker" className="text-muted-foreground hover:text-foreground">Product idea checker</Link>
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
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-foreground">Company</p>
            <Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy policy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of service</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
          <WatchForm source="footer" />
          <p className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">© {new Date().getFullYear()} Dropship Scout. Payments are processed securely by Stripe.</p>
        </div>
      </footer>
    </div>
  )
}
