import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dropship Scout',
  description: 'AI-powered dropshipping product research and Shopify automation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
