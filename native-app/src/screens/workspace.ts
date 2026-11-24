import { tap } from '@/lib/native/device'
import { WORKSPACE_ORIGIN } from '@/lib/native/platform'
import { clear, h } from '../ui'

/** Quick reachability check: the Scout Kit itself never needs the network. */
export async function workspaceReachable(timeoutMs = 4000): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetch(`${WORKSPACE_ORIGIN}/robots.txt`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

export function openWorkspace(path: string) {
  void tap('medium')
  window.location.href = `${WORKSPACE_ORIGIN}${path}`
}

export function renderWorkspace(root: HTMLElement) {
  clear(root)
  const status = h('p', { class: 'status-line muted' }, 'Checking connection…')
  const actions = h('div', { class: 'stack' })

  root.append(
    h('header', { class: 'screen-head' }, h('div', {}, h('h1', {}, 'Workspace'), h('p', { class: 'muted' }, 'Your Dropship Scout account: product explorer, launch workspaces, supplier imports, hosted store, orders and Pro.'))),
    status,
    actions,
    h('div', { class: 'card stack' },
      h('h2', {}, 'What works offline'),
      h('p', { class: 'muted' }, 'The watchlist, supplier notes, profit calculator, exports, reminders and app lock live on this iPhone and work without a connection. The workspace needs internet because it reads your account and live supplier data.'),
    ),
  )

  void workspaceReachable().then(online => {
    status.textContent = online ? 'Online' : 'Offline: the workspace opens when you are connected. Your Scout Kit still works.'
    status.className = `status-line ${online ? 'pos' : 'warn'}`
    clear(actions)
    const btn = (label: string, path: string, primary = false) =>
      h('button', { class: `btn block${primary ? ' primary' : ''}`, type: 'button', disabled: !online, onclick: () => openWorkspace(path) }, label)
    actions.append(
      btn('Open my workspace', '/dashboard', true),
      h('div', { class: 'grid2' }, btn('Sign in', '/auth/login?next=%2Fdashboard'), btn('Create free account', '/auth/sign-up')),
      btn('Product Explorer', '/dashboard/explore'),
      btn('Launch workspace', '/dashboard/launch'),
      btn('Dropship Scout Pro', '/dashboard/settings#pro'),
      btn('Account & delete account', '/dashboard/settings#delete-account'),
    )
  })
}
