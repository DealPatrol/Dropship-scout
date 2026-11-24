import { applyReminder, biometry, notify, shareFile, unlock } from '@/lib/native/device'
import { WORKSPACE_ORIGIN } from '@/lib/native/platform'
import { makeBackup, mergeById, parseBackup, watchlistCsv, type KitSettings } from '@/lib/native/scout-kit'
import { eraseAll, saveSettings, saveSuppliers, saveWatchlist, state } from '../state'
import { clear, confirmAction, field, h, moneyInput, select, toast, toggle } from '../ui'

const WEEKDAYS = ['1', '2', '3', '4', '5', '6', '7']
const WEEKDAY_LABELS: Record<string, string> = { 1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday' }

export function renderSettings(root: HTMLElement, version: string) {
  clear(root)
  const s = state.settings
  const update = async (patch: Partial<KitSettings>) => {
    await saveSettings({ ...state.settings, ...patch })
  }

  const lockHint = h('span', { class: 'field-hint' }, 'Require Face ID, Touch ID or your passcode to open the app.')
  void biometry().then(info => {
    lockHint.textContent = info.available
      ? `Require ${info.type === 'faceId' ? 'Face ID' : info.type === 'touchId' ? 'Touch ID' : info.type === 'opticId' ? 'Optic ID' : 'your passcode'} to open the app.`
      : 'Set a device passcode in iOS Settings to use the app lock.'
  })
  const lockRow = toggle('App lock', s.appLock, async (checked, input) => {
    if (checked) {
      const info = await biometry()
      if (!info.available || !(await unlock('Turn on the Dropship Scout app lock'))) {
        input.checked = false
        void notify('error')
        return
      }
    }
    await update({ appLock: checked })
    void notify('success')
  })
  lockRow.querySelector('span')?.appendChild(lockHint)

  const weekday = select('weekday', WEEKDAYS, String(s.reminder.weekday), WEEKDAY_LABELS)
  const time = h('input', { type: 'time', name: 'time', value: `${String(s.reminder.hour).padStart(2, '0')}:${String(s.reminder.minute).padStart(2, '0')}` })
  const reminderStatus = h('p', { class: 'muted small' })
  const saveReminder = async (enabled: boolean) => {
    const [hour, minute] = time.value.split(':').map(Number)
    const reminder = { enabled, weekday: Number(weekday.value), hour: Number.isInteger(hour) ? hour : 9, minute: Number.isInteger(minute) ? minute : 0 }
    await update({ reminder })
    const result = await applyReminder(state.settings)
    reminderStatus.textContent = result === 'scheduled'
      ? `Every ${WEEKDAY_LABELS[String(reminder.weekday)]} at ${time.value}. The notification never shows product names or numbers.`
      : result === 'denied' ? 'Notifications are off for Dropship Scout. Turn them on in iOS Settings › Notifications.' : ''
    if (result === 'denied') {
      await update({ reminder: { ...reminder, enabled: false } })
      reminderToggleInput.checked = false
    }
  }
  const reminderRow = toggle('Weekly scout reminder', s.reminder.enabled, checked => void saveReminder(checked), 'A local check-in to review your watchlist and supplier quotes.')
  const reminderToggleInput = reminderRow.querySelector('input') as HTMLInputElement
  weekday.addEventListener('change', () => { if (reminderToggleInput.checked) void saveReminder(true) })
  time.addEventListener('change', () => { if (reminderToggleInput.checked) void saveReminder(true) })

  const fee = (key: 'paymentFeePercent' | 'paymentFeeFlat' | 'platformFeePercent' | 'returnsReservePercent', label: string, max: number) => {
    const input = moneyInput(key, s[key])
    input.addEventListener('change', async () => {
      const n = Number(input.value)
      if (!Number.isFinite(n) || n < 0 || n > max) {
        input.value = String(state.settings[key])
        toast('Enter a number between 0 and ' + max)
        return
      }
      await update({ [key]: n } as Partial<KitSettings>)
      toast('Saved')
    })
    return field(label, input)
  }

  const importInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden' })
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0]
    if (!file) return
    const parsed = parseBackup(await file.text())
    importInput.value = ''
    if (!parsed) {
      toast('That file is not a Dropship Scout backup.')
      void notify('error')
      return
    }
    await saveWatchlist(mergeById(state.watchlist, parsed.watchlist))
    await saveSuppliers(mergeById(state.suppliers, parsed.suppliers))
    void notify('success')
    toast(`Imported ${parsed.watchlist.length} products and ${parsed.suppliers.length} suppliers`)
  })

  const link = (label: string, path: string) => h('a', { class: 'list-link', href: `${WORKSPACE_ORIGIN}${path}` }, label, h('span', { 'aria-hidden': 'true' }, '›'))

  root.append(
    h('header', { class: 'screen-head' }, h('div', {}, h('h1', {}, 'Settings'))),
    h('section', { class: 'card stack' }, h('h2', {}, 'Privacy & security'), lockRow,
      toggle('Haptics', s.haptics, async checked => { await update({ haptics: checked }) })),
    h('section', { class: 'card stack' }, h('h2', {}, 'Reminders'), reminderRow, h('div', { class: 'grid2' }, field('Day', weekday), field('Time', time)), reminderStatus),
    h('section', { class: 'card stack' }, h('h2', {}, 'Default fees'), h('p', { class: 'muted small' }, 'Used by the calculator and watchlist margins.'),
      h('div', { class: 'grid2' },
        fee('paymentFeePercent', 'Card fee (%)', 100),
        fee('paymentFeeFlat', 'Card fee flat ($)', 1000),
        fee('platformFeePercent', 'Platform fee (%)', 100),
        fee('returnsReservePercent', 'Refund reserve (%)', 100),
      )),
    h('section', { class: 'card stack' }, h('h2', {}, 'Backup & export'),
      h('button', { class: 'btn block', type: 'button', onclick: async () => {
        const json = JSON.stringify(makeBackup(state.watchlist, state.suppliers), null, 2)
        await shareFile(`dropship-scout-backup-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json', 'Scout Kit backup')
      } }, 'Export backup (JSON)'),
      h('button', { class: 'btn block', type: 'button', onclick: () => importInput.click() }, 'Import backup'),
      importInput,
      h('button', { class: 'btn block', type: 'button', disabled: state.watchlist.length === 0, onclick: async () => {
        await shareFile(`dropship-scout-watchlist-${new Date().toISOString().slice(0, 10)}.csv`, watchlistCsv(state.watchlist, state.suppliers, state.settings), 'text/csv', 'Watchlist CSV')
      } }, 'Export watchlist (CSV)'),
      h('button', { class: 'btn danger block', type: 'button', onclick: async () => {
        if (!confirmAction('Erase every watchlist product, supplier note and setting stored on this iPhone? Your online account is not affected.')) return
        await eraseAll()
        await applyReminder(state.settings)
        void notify('warning')
        renderSettings(root, version)
        toast('Local Scout Kit data erased')
      } }, 'Erase data on this iPhone'),
    ),
    h('section', { class: 'card stack' }, h('h2', {}, 'About'),
      link('Privacy policy', '/privacy'),
      link('Terms of service', '/terms'),
      link('Help & contact', '/contact'),
      link('Delete my account', '/dashboard/settings#delete-account'),
      h('p', { class: 'muted small' }, `Dropship Scout ${version}. Scout Kit data stays on this device unless you export it.`),
    ),
  )
}
