'use client'

import { isNativeIos } from '@/lib/native/platform'

/**
 * A download link that also works in the iOS app, where WKWebView cannot save
 * attachment responses: there the file is fetched and handed to the Share Sheet.
 */
export function ExportLink({ href, fileName, className, children }: { href: string; fileName: string; className?: string; children: React.ReactNode }) {
  async function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!isNativeIos()) return
    event.preventDefault()
    try {
      const { shareRemoteExport } = await import('@/lib/native/device')
      await shareRemoteExport(href, fileName)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Export failed')
    }
  }
  return <a href={href} className={className} onClick={onClick}>{children}</a>
}
