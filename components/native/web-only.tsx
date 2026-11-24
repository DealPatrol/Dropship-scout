'use client'

import { useEffect, useState } from 'react'
import { isNativeIos } from '@/lib/native/platform'

/**
 * Mounts children only on the web, after hydration. Inside the iOS app nothing
 * mounts, so ad pixels and tag scripts never load there (they are not declared
 * in the App Store privacy label). Use the `web-only` CSS class instead for
 * server-rendered content that must stay in the HTML for search engines.
 */
export function WebOnlyScripts({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  useEffect(() => setShow(!isNativeIos()), [])
  return show ? <>{children}</> : null
}

/** Renders children only inside the iOS app. */
export function NativeIosOnly({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  useEffect(() => setShow(isNativeIos()), [])
  return show ? <>{children}</> : null
}
