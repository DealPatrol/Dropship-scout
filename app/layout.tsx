import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { siteUrl } from '@/lib/site'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Dropship Scout — hosted dropshipping storefront',
    template: '%s · Dropship Scout',
  },
  description:
    'Sign up, import products from a real supplier, and sell on a hosted storefront with Stripe checkout. Shopify is optional.',
  keywords: ['dropshipping', 'dropshipping without shopify', 'cjdropshipping', 'printful', 'printify', 'hosted storefront'],
  openGraph: {
    title: 'Dropship Scout',
    description: 'Hosted dropshipping storefront with supplier fulfillment and automatic payouts.',
    type: 'website',
    url: '/',
    siteName: 'Dropship Scout',
  },
  twitter: { card: 'summary_large_image', title: 'Dropship Scout', description: 'Hosted dropshipping storefront with supplier fulfillment.' },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${_inter.variable} dark`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  )
}
