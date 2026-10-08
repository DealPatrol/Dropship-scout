import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdsTags } from '@/components/ads/ads-tags'
import { AttributionCapture } from '@/components/ads/attribution-capture'
import { Toaster } from '@/components/ui/toaster'
import { SITE_NAME, siteUrl } from '@/lib/site'

const _inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter', adjustFontFallback: true })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    'Dropshipping product research with a sample catalog, supplier import, and an optional hosted store. Pro is billed in Stripe.',
  applicationName: SITE_NAME,
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
        <AttributionCapture />
        <AdsTags />
        <Analytics />
      </body>
    </html>
  )
}
