// zustand bridge between the pure engine and the React/scene layers.
// Components dispatch actions and read state — they never compute game logic.

import { create } from 'zustand'
import { createInitialState, reduce } from './engine/engine'
import { JUDGE_REGION, JUDGE_SEED, judgeMidgame } from './engine/judge'
import { seedFromString } from './engine/rng'
import { REGIONS } from './engine/data'
import type { GameAction, GameState, RegionId } from './engine/types'
import type { Lang, StringKey } from './engine/strings'
import { saveRepo } from './services/saves'

export type Screen = 'title' | 'region' | 'game'
export type Panel = 'build' | 'trust' | 'market'

interface Store {
  booted: boolean
  screen: Screen
  lang: Lang
  hasSave: boolean
  fxHigh: boolean
  state: GameState | null
  lastRejection: StringKey | null
  panel: Panel | null // open bottom sheet
  summaryOpen: boolean // turn-resolution modal after endTurn
  hppOpen: boolean // Namakhvani interstitial
  actSplash: 2 | 3 | null // shown once when an act is reached (after the summary)
  expandOpen: boolean // second-region picker (Act II)
  mapOpen: boolean // world export map

  boot(): Promise<void>
  setLang(lang: Lang): void
  setScreen(screen: Screen): void
  setPanel(panel: Panel | null): void
  setHppOpen(open: boolean): void
  setExpandOpen(open: boolean): void
  setMapOpen(open: boolean): void
  closeSummary(): void
  closeActSplash(): void
  clearRejection(): void
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
  panel: null,
  summaryOpen: false,
  hppOpen: false,
  actSplash: null,
  expandOpen: false,
  mapOpen: false,

  async boot() {
    const q = urlParams()
    if (new URLSearchParams(window.location.search).get('big') === '1') {
      document.documentElement.classList.add('big') // demo laptop font bump (docs/03 §10)
    }
    if (q.act === '2' || q.act === '3') {
      // Judge mode: deterministic prepared midgame (docs/03 §10)
      const seed = q.seed ? (/^\d+$/.test(q.seed) ? Number(q.seed) >>> 0 : seedFromString(q.seed)) : JUDGE_SEED
      const state = judgeMidgame(seed, q.region ?? JUDGE_REGION, Number(q.act) as 2 | 3)
      set({ booted: true, fxHigh: q.fxHigh, state, screen: 'game', actSplash: Number(q.act) as 2 | 3 })
      return
    }
    if (q.seed && q.region) {
      // Deterministic replay entry: ?seed=&region=
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
    set({ screen, panel: null, summaryOpen: false })
  },

  setPanel(panel) {
    set({ panel, lastRejection: null })
  },

  setHppOpen(open) {
    set({ hppOpen: open })
  },

  setExpandOpen(open) {
    set({ expandOpen: open })
  },

  setMapOpen(open) {
    set({ mapOpen: open })
  },

  closeSummary() {
    set({ summaryOpen: false })
  },

  closeActSplash() {
    set({ actSplash: null })
  },

  clearRejection() {
    set({ lastRejection: null })
  },

  newGame(region) {
    const seed = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0
    const state = createInitialState(seed, region)
    set({ state, screen: 'game', lastRejection: null, panel: null, summaryOpen: false })
    saveRepo.persist(state).catch(() => {})
  },

  async continueGame() {
    const save = await saveRepo.load().catch(() => null)
    if (save) set({ state: save.state, screen: 'game', lastRejection: null, panel: null, summaryOpen: false })
  },

  dispatch(action) {
    const prev = get().state
    if (!prev) return
    const { state, rejected } = reduce(prev, action)
    set({ state, lastRejection: (rejected as StringKey) ?? null })
    if (!rejected) {
      saveRepo.persist(state).catch(() => {}) // autosave EVERY turn
      if (action.type === 'endTurn') {
        set({ summaryOpen: true, panel: null })
        // act splash queues behind the summary modal
        if (state.act > prev.act && (state.act === 2 || state.act === 3)) set({ actSplash: state.act })
      }
    }
  },
}))
