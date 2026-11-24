// lib/native/device.ts
// Thin wrappers around Capacitor 8 plugins used by the bundled Scout Kit and by
// the hosted dashboard when it runs inside the iOS app. Every call is safe on
// the web: it falls back or no-ops when the native bridge is not present.

import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'
import { Share } from '@capacitor/share'
import { DropshipScoutNative } from './native-plugin'
import { REMINDER, STORAGE_KEYS, parseSettings, type KitSettings } from './scout-kit'

export function nativeAvailable(): boolean {
  return Capacitor.isNativePlatform()
}

// ─── Storage (UserDefaults via Preferences; shared by the bundled kit and the workspace) ──

export async function readKey(key: string): Promise<string | null> {
  if (!nativeAvailable()) return typeof localStorage === 'undefined' ? null : localStorage.getItem(key)
  const { value } = await Preferences.get({ key })
  return value
}

export async function writeKey(key: string, value: string): Promise<void> {
  if (!nativeAvailable()) {
    localStorage.setItem(key, value)
    return
  }
  await Preferences.set({ key, value })
}

export async function removeKey(key: string): Promise<void> {
  if (!nativeAvailable()) {
    localStorage.removeItem(key)
    return
  }
  await Preferences.remove({ key })
}

export async function loadSettings(): Promise<KitSettings> {
  return parseSettings(await readKey(STORAGE_KEYS.settings))
}

// ─── Haptics ──────────────────────────────────────────────────────────────

let hapticsEnabled = true
export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled
}

export async function tap(style: 'light' | 'medium' = 'light') {
  if (!nativeAvailable() || !hapticsEnabled) return
  await Haptics.impact({ style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => undefined)
}

export async function notify(kind: 'success' | 'warning' | 'error') {
  if (!nativeAvailable() || !hapticsEnabled) return
  const type = kind === 'success' ? NotificationType.Success : kind === 'warning' ? NotificationType.Warning : NotificationType.Error
  await Haptics.notification({ type }).catch(() => undefined)
}

// ─── Share Sheet ───────────────────────────────────────────────────────────

/** Share plain text (research card, supplier brief) through the iOS Share Sheet. */
export async function shareText(title: string, text: string): Promise<'shared' | 'copied' | 'cancelled'> {
  if (nativeAvailable()) {
    try {
      await Share.share({ title, text, dialogTitle: title })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  await navigator.clipboard?.writeText(text)
  return 'copied'
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'export.txt'
}

/**
 * Writes a file to the app cache and opens the Share Sheet so it can be saved to
 * Files, AirDrop'd, mailed or messaged. On the web it downloads the file instead.
 * (WKWebView ignores <a download>, so the native path is required in the app.)
 */
export async function shareFile(fileName: string, content: string, mimeType: string, title = fileName): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const name = safeFileName(fileName)
  if (!nativeAvailable()) {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'downloaded'
  }
  const written = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true })
  try {
    await Share.share({ title, files: [written.uri], dialogTitle: title })
    return 'shared'
  } catch {
    return 'cancelled'
  }
}

/** Fetches a same-origin export (cookies included) and shares it as a file. */
export async function shareRemoteExport(url: string, fileName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(typeof data.error === 'string' ? data.error : 'Export failed')
  }
  const type = response.headers.get('content-type') ?? 'text/plain'
  return shareFile(fileName, await response.text(), type)
}

// ─── App lock (Face ID / Touch ID / passcode) ─────────────────────────────

export async function biometry() {
  if (!nativeAvailable()) return { available: false, type: 'passcode' as const }
  return DropshipScoutNative.biometryInfo().catch(() => ({ available: false, type: 'passcode' as const }))
}

export async function unlock(reason = 'Unlock Dropship Scout'): Promise<boolean> {
  if (!nativeAvailable()) return true
  const result = await DropshipScoutNative.authenticate({ reason }).catch(() => ({ ok: false }))
  return result.ok
}

// ─── Weekly local reminder ───────────────────────────────────────────────

export async function applyReminder(settings: KitSettings): Promise<'scheduled' | 'off' | 'denied'> {
  if (!nativeAvailable()) return 'off'
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER.id }] }).catch(() => undefined)
  if (!settings.reminder.enabled) return 'off'
  let permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') return 'denied'
  await LocalNotifications.schedule({
    notifications: [{
      id: REMINDER.id,
      title: REMINDER.title,
      body: REMINDER.body,
      schedule: {
        on: { weekday: settings.reminder.weekday, hour: settings.reminder.hour, minute: settings.reminder.minute },
        allowWhileIdle: true,
      },
      extra: { deepLink: 'dropshipscout://watchlist' },
    }],
  })
  return 'scheduled'
}
