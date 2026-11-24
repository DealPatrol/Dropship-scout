// Scout Kit state: loaded once from native Preferences (UserDefaults), written
// back on every change. Everything works offline.

import { readKey, removeKey, setHapticsEnabled, writeKey } from '@/lib/native/device'
import {
  STORAGE_KEYS,
  normalizeSupplier,
  normalizeWatchItem,
  parseList,
  parseSettings,
  type KitSettings,
  type SupplierNote,
  type WatchItem,
} from '@/lib/native/scout-kit'
import type { ProfitQuoteFields } from '@/lib/marketing/profit-calculator'

export interface KitState {
  watchlist: WatchItem[]
  suppliers: SupplierNote[]
  settings: KitSettings
  calculator: Partial<ProfitQuoteFields> & { name?: string }
}

export const state: KitState = {
  watchlist: [],
  suppliers: [],
  settings: parseSettings(null),
  calculator: {},
}

export async function loadState(): Promise<void> {
  const [watchlist, suppliers, settings, calculator] = await Promise.all([
    readKey(STORAGE_KEYS.watchlist),
    readKey(STORAGE_KEYS.suppliers),
    readKey(STORAGE_KEYS.settings),
    readKey(STORAGE_KEYS.calculator),
  ])
  state.watchlist = parseList(watchlist, raw => normalizeWatchItem(raw))
  state.suppliers = parseList(suppliers, raw => normalizeSupplier(raw))
  state.settings = parseSettings(settings)
  try {
    const calc = calculator ? JSON.parse(calculator) : {}
    state.calculator = calc && typeof calc === 'object' ? calc : {}
  } catch {
    state.calculator = {}
  }
  setHapticsEnabled(state.settings.haptics)
}

export async function saveWatchlist(list: WatchItem[]) {
  state.watchlist = list
  await writeKey(STORAGE_KEYS.watchlist, JSON.stringify(list))
}

export async function saveSuppliers(list: SupplierNote[]) {
  state.suppliers = list
  await writeKey(STORAGE_KEYS.suppliers, JSON.stringify(list))
}

export async function saveSettings(settings: KitSettings) {
  state.settings = settings
  setHapticsEnabled(settings.haptics)
  await writeKey(STORAGE_KEYS.settings, JSON.stringify(settings))
}

export async function saveCalculator(values: KitState['calculator']) {
  state.calculator = values
  await writeKey(STORAGE_KEYS.calculator, JSON.stringify(values))
}

export async function eraseAll() {
  await Promise.all(Object.values(STORAGE_KEYS).map(key => removeKey(key)))
  state.watchlist = []
  state.suppliers = []
  state.settings = parseSettings(null)
  state.calculator = {}
  setHapticsEnabled(true)
}
