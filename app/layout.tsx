import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Dropship Scout — AI-Powered Product Research',
  description:
    'Find winning dropshipping products in seconds with AI. Analyze trends, margins, and push directly to your Shopify store.',
  keywords: ['dropshipping', 'product research', 'shopify', 'ai', 'ecommerce'],
  openGraph: {
    title: 'Dropship Scout',
    description: 'AI-powered dropshipping product research & Shopify automation',
    type: 'website',
  },
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
