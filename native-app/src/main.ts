// Dropship Scout iOS — bundled offline Scout Kit.
// Tabs: Watchlist · Calculator · Suppliers · Workspace · Settings.

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import { LocalNotifications } from '@capacitor/local-notifications'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { tap, unlock } from '@/lib/native/device'
import { WORKSPACE_ORIGIN, isScoutKitRoute, parseDeepLink, type ScoutKitRoute } from '@/lib/native/platform'
import { renderCalculator } from './screens/calculator'
import { renderSettings } from './screens/settings'
import { renderSuppliers } from './screens/suppliers'
import { renderWatchlist } from './screens/watchlist'
import { renderWorkspace } from './screens/workspace'
import { loadState, state } from './state'
import { h } from './ui'

const VERSION = '1.0.0'

const TABS: Array<{ route: ScoutKitRoute; label: string; icon: string }> = [
  // Static Lucide-style outline icons (ISC licence), inlined so they render offline.
  { route: 'watchlist', label: 'Watchlist', icon: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>' },
  { route: 'calculator', label: 'Calculator', icon: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01M8 10h8"/>' },
  { route: 'suppliers', label: 'Suppliers', icon: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>' },
  { route: 'workspace', label: 'Workspace', icon: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>' },
  { route: 'settings', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
]

const app = document.getElementById('app') as HTMLElement
const screen = h('main', { id: 'screen', class: 'screen' })
const tabbar = h('nav', { class: 'tabbar', 'aria-label': 'Sections' })
app.append(screen, tabbar)

function icon(paths: string): HTMLElement {
  const span = h('span', { class: 'tab-icon', 'aria-hidden': 'true' })
  // Static markup from the TABS constant above, never user data.
  span.innerHTML = `<svg viewBox="0 0 24 24">${paths}</svg>`
  return span
}

function currentRoute(): { route: ScoutKitRoute; id?: string } {
  const [, route = 'watchlist', id] = window.location.hash.replace(/^#/, '').split('/')
  return isScoutKitRoute(route) ? { route, id } : { route: 'watchlist' }
}

function render() {
  const { route, id } = currentRoute()
  tabbar.replaceChildren(...TABS.map(tab =>
    h('a', { href: `#/${tab.route}`, class: `tab${tab.route === route ? ' active' : ''}`, 'aria-current': tab.route === route ? 'page' : undefined, onclick: () => void tap() },
      icon(tab.icon),
      h('span', { class: 'tab-label' }, tab.label),
    ),
  ))
  screen.scrollTop = 0
  if (route === 'watchlist') renderWatchlist(screen, id)
  else if (route === 'calculator') renderCalculator(screen)
  else if (route === 'suppliers') renderSuppliers(screen, id)
  else if (route === 'workspace') renderWorkspace(screen)
  else renderSettings(screen, VERSION)
}

function handleDeepLink(url: string) {
  const target = parseDeepLink(url)
  if (target.kind === 'workspace') {
    window.location.href = `${WORKSPACE_ORIGIN}${target.path}`
    return
  }
  const hash = `#/${target.route}${target.id ? `/${target.id}` : ''}`
  if (window.location.hash === hash) render()
  else window.location.hash = hash
}

// ─── App lock ────────────────────────────────────────────────────────────
let locked = false
async function lockIfEnabled() {
  if (!state.settings.appLock || locked) return
  locked = true
  const overlay = h('div', { class: 'lock', role: 'dialog', 'aria-label': 'Dropship Scout is locked' },
    h('img', { src: './icon.png', alt: '', width: 72, height: 72 }),
    h('p', { class: 'lock-title' }, 'Dropship Scout is locked'),
    h('button', { class: 'btn primary', type: 'button', onclick: () => void attempt() }, 'Unlock'),
  )
  document.body.appendChild(overlay)
  const attempt = async () => {
    if (await unlock('Unlock Dropship Scout')) {
      overlay.remove()
      locked = false
    }
  }
  await attempt()
}

async function boot() {
  await loadState()
  window.addEventListener('hashchange', render)
  render()

  if (!Capacitor.isNativePlatform()) return
  document.documentElement.classList.add('native')
  await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined)
  await Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => undefined)
  await lockIfEnabled()
  await SplashScreen.hide().catch(() => undefined)

  await App.addListener('appUrlOpen', event => handleDeepLink(event.url))
  await App.addListener('appStateChange', ({ isActive }) => { if (isActive) void lockIfEnabled() })
  await LocalNotifications.addListener('localNotificationActionPerformed', action => {
    const link = action.notification.extra?.deepLink
    handleDeepLink(typeof link === 'string' ? link : 'dropshipscout://watchlist')
  })
  // Cold start from a deep link.
  const launch = await App.getLaunchUrl().catch(() => undefined)
  if (launch?.url) handleDeepLink(launch.url)
}

void boot()
