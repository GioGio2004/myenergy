// zustand bridge between the pure engine and the React/scene layers.
// Components dispatch actions and read state — they never compute game logic.

import { create } from 'zustand'
import { createInitialState, reduce } from './engine/engine'
import { seedFromString } from './engine/rng'
import { REGIONS } from './engine/data'
import type { GameAction, GameState, RegionId } from './engine/types'
import type { Lang, StringKey } from './engine/strings'
import { saveRepo } from './services/saves'

export type Screen = 'title' | 'region' | 'game'

interface Store {
  booted: boolean
  screen: Screen
  lang: Lang
  hasSave: boolean
  fxHigh: boolean
  state: GameState | null
  lastRejection: StringKey | null

  boot(): Promise<void>
  setLang(lang: Lang): void
  setScreen(screen: Screen): void
  newGame(region: RegionId): void
  continueGame(): Promise<void>
  dispatch(action: GameAction): void
}

function urlParams() {
  const p = new URLSearchParams(window.location.search)
  const region = p.get('region') as RegionId | null
  return {
    seed: p.get('seed'),
    region: region && REGIONS.some((r) => r.id === region) ? region : null,
    act: p.get('act'), // judge mode — wired to prepared midgames at M5
    fxHigh: p.get('fx') === 'high',
  }
}

export const useStore = create<Store>((set, get) => ({
  booted: false,
  screen: 'title',
  lang: (localStorage.getItem('deni.lang') as Lang) || 'ka',
  hasSave: false,
  fxHigh: false,
  state: null,
  lastRejection: null,

  async boot() {
    const q = urlParams()
    if (q.seed && q.region) {
      // Deterministic replay entry: ?seed=&region=(&act= at M5)
      const seed = /^\d+$/.test(q.seed) ? Number(q.seed) >>> 0 : seedFromString(q.seed)
      set({ booted: true, fxHigh: q.fxHigh, state: createInitialState(seed, q.region), screen: 'game' })
      return
    }
    const save = await saveRepo.load().catch(() => null)
    set({ booted: true, fxHigh: q.fxHigh, hasSave: Boolean(save) })
  },

  setLang(lang) {
    localStorage.setItem('deni.lang', lang)
    set({ lang })
  },

  setScreen(screen) {
    set({ screen })
  },

  newGame(region) {
    const seed = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0
    const state = createInitialState(seed, region)
    set({ state, screen: 'game', lastRejection: null })
    saveRepo.persist(state).catch(() => {})
  },

  async continueGame() {
    const save = await saveRepo.load().catch(() => null)
    if (save) set({ state: save.state, screen: 'game', lastRejection: null })
  },

  dispatch(action) {
    const prev = get().state
    if (!prev) return
    const { state, rejected } = reduce(prev, action)
    set({ state, lastRejection: (rejected as StringKey) ?? null })
    if (!rejected) saveRepo.persist(state).catch(() => {}) // autosave EVERY turn
  },
}))
