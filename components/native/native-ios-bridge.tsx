'use client'

// Runs only inside the Dropship Scout iOS app (Capacitor 8) when the hosted
// workspace is open in the app's web view. It wires the native shell into the
// website: deep links, notification taps, status bar, Face ID app lock on
// resume, App Store entitlement refresh, and a way back to the offline Scout Kit.

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isNativeIos, parseDeepLink, scoutKitUrl } from '@/lib/native/platform'

export function NativeIosBridge() {
  const router = useRouter()
  const pathname = usePathname()
  const [native, setNative] = useState(false)
  const [locked, setLocked] = useState(false)
  const unlocking = useRef(false)

  useEffect(() => {
    if (!isNativeIos()) return
    setNative(true)
    document.documentElement.classList.add('native-ios')
    const meta = document.querySelector<HTMLMetaElement>('meta[name=viewport]')
    if (meta && !meta.content.includes('viewport-fit')) meta.content += ',viewport-fit=cover'

    const cleanups: Array<() => void> = []
    let cancelled = false

    const go = (url: string) => {
      const target = parseDeepLink(url)
      if (target.kind === 'kit') window.location.href = scoutKitUrl(target.route, target.id)
      else router.push(target.path)
    }

    void (async () => {
      const [{ App }, { StatusBar, Style }, { LocalNotifications }, device] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/status-bar'),
        import('@capacitor/local-notifications'),
        import('@/lib/native/device'),
      ])
      if (cancelled) return
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined)
      const settings = await device.loadSettings()
      device.setHapticsEnabled(settings.haptics)

      const urlHandle = await App.addListener('appUrlOpen', event => go(event.url))
      const noteHandle = await LocalNotifications.addListener('localNotificationActionPerformed', action => {
        const link = action.notification.extra?.deepLink
        if (typeof link === 'string') go(link)
      })
      const stateHandle = await App.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) return
        const current = await device.loadSettings()
        if (!current.appLock || unlocking.current) return
        unlocking.current = true
        setLocked(true)
        const ok = await device.unlock('Unlock Dropship Scout')
        unlocking.current = false
        if (ok) setLocked(false)
      })
      cleanups.push(() => void urlHandle.remove(), () => void noteHandle.remove(), () => void stateHandle.remove())
    })()

    return () => {
      cancelled = true
      cleanups.forEach(fn => fn())
    }
  }, [router])

  // Keep the server's view of App Store renewals current while signed in.
  useEffect(() => {
    if (!native || !pathname.startsWith('/dashboard')) return
    void import('@/lib/native/iap').then(({ refreshEntitlements }) => refreshEntitlements()).catch(() => undefined)
    // Once per full page load is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native])

  async function retryUnlock() {
    const device = await import('@/lib/native/device')
    if (await device.unlock('Unlock Dropship Scout')) setLocked(false)
  }

  if (!native) return null

  return (
    <>
      {!pathname.startsWith('/dashboard') && (
        <a
          href={scoutKitUrl('watchlist')}
          className="fixed z-40 left-3 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          ‹ Scout Kit
        </a>
      )}
      {locked && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background">
          <p className="text-lg font-semibold">Dropship Scout is locked</p>
          <button type="button" onClick={() => void retryUnlock()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Unlock
          </button>
        </div>
      )}
    </>
  )
}
