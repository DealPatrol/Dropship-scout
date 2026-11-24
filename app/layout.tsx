import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdsTags } from '@/components/ads/ads-tags'
import { AttributionCapture } from '@/components/ads/attribution-capture'
import { Toaster } from '@/components/ui/toaster'
import { NativeClassScript } from '@/components/native/native-class-script'
import { NativeIosBridge } from '@/components/native/native-ios-bridge'
import { WebOnlyScripts } from '@/components/native/web-only'
import { SITE_NAME, siteUrl } from '@/lib/site'
import { googleSiteVerificationToken } from '@/lib/site-verification'

const googleSiteVerification = googleSiteVerificationToken()

const _inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter', adjustFontFallback: true })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
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
      <head>
        <NativeClassScript />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Toaster>{children}</Toaster>
        <AttributionCapture />
        {/* Ad pixels load on the web only, never inside the iOS app. */}
        <WebOnlyScripts>
          <AdsTags />
        </WebOnlyScripts>
        <Analytics />
        <NativeIosBridge />
      </body>
    </html>
  )
}
