'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { rememberOrigin } from '@/lib/analytics/track-funnel'

/** Remember the last public page so later signup and checkout events can name it. */
export function OriginBeacon() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname) rememberOrigin(pathname)
  }, [pathname])
  return null
}
