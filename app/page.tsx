import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Radar,
  Search,
  TrendingUp,
  ShoppingBag,
  Zap,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Globe,
  Star,
} from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'AI-Powered Research',
    description:
      'Claude AI scans AliExpress, Amazon, Temu, and 5 more platforms to surface products with the highest margin potential.',
  },
  {
    icon: TrendingUp,
    title: 'Trend & Margin Analysis',
    description:
      'Every product gets a real-time score — trend signal, competition level, monthly sales estimate, and profit margin.',
  },
  {
    icon: ShoppingBag,
    title: 'One-Click Shopify Push',
    description:
      'Push winning products directly to your Shopify store. Your access token is encrypted and never exposed to the browser.',
  },
  {
    icon: BarChart3,
    title: 'Saved Product Vault',
    description:
      'Save products to your private vault. Scores refresh hourly so you always have the freshest market data.',
  },
  {
    icon: Globe,
    title: 'Multi-Platform Coverage',
    description:
      'Search across 8 supplier platforms in a single query — AliExpress, Amazon, Temu, Walmart, eBay, CJDropship, Spocket, Zendrop.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description:
      'Get 8 curated, AI-analyzed products in under 10 seconds. No waiting, no manual research, no guessing.',
  },
]

const stats = [
  { value: '8', label: 'Supplier platforms' },
  { value: '10s', label: 'Average search time' },
  { value: '100%', label: 'Shopify compatible' },
  { value: 'AI', label: 'Powered by Claude' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-20 pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Radar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Dropship Scout</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Get started free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6">
          <Zap className="h-3 w-3" />
          Powered by Anthropic Claude AI
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight text-balance">
          Find winning dropship<br />
          products in seconds.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty">
          AI scans 8 supplier platforms, analyzes margins and competition, then pushes your best picks straight to Shopify.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2 px-6">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="px-6">
              Sign in
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-lg border border-border bg-card/60 backdrop-blur-sm px-4 py-3 text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">
            Everything you need to find and sell winning products
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">
            From product discovery to Shopify listing — all in one dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(feature => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 mb-3">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Free plan available</span>
              </div>
              <h2 className="text-xl font-bold text-foreground text-balance">Start researching products today</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Create your free account and get unlimited AI product searches. No credit card required.
              </p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {[
                  'Unlimited AI product searches',
                  'Save products to your vault',
                  'Push to Shopify with one click',
                  'Push history & analytics',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gap-2 px-8">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
              <Radar className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Dropship Scout</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-powered dropshipping product research
          </p>
        </div>
      </footer>
    </div>
  )
}
