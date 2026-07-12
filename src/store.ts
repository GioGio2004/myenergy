// zustand bridge between the pure engine and the React/scene layers.
// Components dispatch actions and read state — they never compute game logic.

import { create } from 'zustand'
import { cityStats, createInitialState, reduce } from './engine/engine'
import { JUDGE_REGION, JUDGE_SEED, judgeMidgame } from './engine/judge'
import { seedFromString } from './engine/rng'
import { REGIONS } from './engine/data'
import type { BuildableId, GameAction, GameState, RegionId } from './engine/types'
import type { Lang, StringKey } from './engine/strings'
import { saveRepo } from './services/saves'

export type Screen = 'title' | 'region' | 'game'
export type Panel = 'build' | 'trust' | 'market'

export interface PlacementMode {
  buildable: BuildableId
  region: RegionId
}

export interface LiveChange {
  id: number
  region: RegionId
  kind: GameAction['type']
  money: number
  trust: number
  jobs: number
  happiness: number
  coverage: number
  population: number
}

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
  nationalMapOpen: boolean // zoom-out national map: switch region / expand
  viewRegion: RegionId | null // region currently shown by the diorama
  placement: PlacementMode | null
  selectedPlantId: number | null
  lastChange: LiveChange | null

  boot(): Promise<void>
  setLang(lang: Lang): void
  setScreen(screen: Screen): void
  setPanel(panel: Panel | null): void
  setHppOpen(open: boolean): void
  setExpandOpen(open: boolean): void
  setMapOpen(open: boolean): void
  setNationalMapOpen(open: boolean): void
  setViewRegion(region: RegionId): void
  beginPlacement(buildable: BuildableId, region: RegionId): void
  cancelPlacement(): void
  selectPlant(plantId: number | null): void
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
    // Premium shadows default ON for desktop (all regions); ?fx=low or mobile opts
    // out for perf. Was opt-in (?fx=high) which is why shadows "didn't show".
    fxHigh: p.get('fx') !== 'low' && !window.matchMedia('(max-width: 720px)').matches,
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
  nationalMapOpen: false,
  viewRegion: null,
  placement: null,
  selectedPlantId: null,
  lastChange: null,

  async boot() {
    const q = urlParams()
    if (new URLSearchParams(window.location.search).get('big') === '1') {
      document.documentElement.classList.add('big') // demo laptop font bump (docs/03 §10)
    }
    if (q.act === '2' || q.act === '3') {
      // Judge mode: deterministic prepared midgame (docs/03 §10)
      const seed = q.seed ? (/^\d+$/.test(q.seed) ? Number(q.seed) >>> 0 : seedFromString(q.seed)) : JUDGE_SEED
      const state = judgeMidgame(seed, q.region ?? JUDGE_REGION, Number(q.act) as 2 | 3)
      set({ booted: true, fxHigh: q.fxHigh, state, viewRegion: state.regions[0], screen: 'game', actSplash: Number(q.act) as 2 | 3 })
      return
    }
    if (q.seed && q.region) {
      // Deterministic replay entry: ?seed=&region=
      const seed = /^\d+$/.test(q.seed) ? Number(q.seed) >>> 0 : seedFromString(q.seed)
      set({ booted: true, fxHigh: q.fxHigh, state: createInitialState(seed, q.region), viewRegion: q.region, screen: 'game' })
      return
    }
    const save = await saveRepo.load().catch(() => null)
    set({ booted: true, fxHigh: q.fxHigh, hasSave: Boolean(save?.state.v === 3) })
  },

  setLang(lang) {
    localStorage.setItem('deni.lang', lang)
    set({ lang })
  },

  setScreen(screen) {
    set({ screen, panel: null, summaryOpen: false, placement: null, selectedPlantId: null })
  },

  setPanel(panel) {
    set({ panel, lastRejection: null, placement: null, selectedPlantId: null })
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

  setNationalMapOpen(open) {
    set({ nationalMapOpen: open })
  },

  setViewRegion(region) {
    const state = get().state
    if (state?.regions.includes(region)) set({ viewRegion: region, placement: null, selectedPlantId: null, lastChange: null })
  },

  beginPlacement(buildable, region) {
    set({ placement: { buildable, region }, viewRegion: region, selectedPlantId: null, panel: null, lastRejection: null })
  },

  cancelPlacement() {
    set({ placement: null })
  },

  selectPlant(plantId) {
    set({ selectedPlantId: plantId, placement: null })
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
    set({ state, screen: 'game', viewRegion: region, lastRejection: null, panel: null, summaryOpen: false, placement: null, selectedPlantId: null, lastChange: null })
    saveRepo.persist(state).catch(() => {})
  },

  async continueGame() {
    const save = await saveRepo.load().catch(() => null)
    if (save?.state.v === 3) set({ state: save.state, screen: 'game', viewRegion: save.state.regions[0], lastRejection: null, panel: null, summaryOpen: false, placement: null, selectedPlantId: null, lastChange: null })
  },

  dispatch(action) {
    const prev = get().state
    if (!prev) return
    const actionRegion =
      'region' in action
        ? action.region
        : action.type === 'demolish'
          ? prev.plants.find((p) => p.id === action.plantId)?.region
          : undefined
    const region = actionRegion ?? get().viewRegion ?? prev.regions[0]
    const beforeStats = cityStats(prev, region)
    const beforeTrust = prev.regionState[region]?.trust ?? 0
    const { state, rejected } = reduce(prev, action)
    const afterStats = cityStats(state, region)
    const afterTrust = state.regionState[region]?.trust ?? beforeTrust
    const lastChange: LiveChange | null = rejected
      ? get().lastChange
      : {
          id: state.log.length,
          region,
          kind: action.type,
          money: state.money - prev.money,
          trust: Math.round(afterTrust - beforeTrust),
          jobs: afterStats.jobs - beforeStats.jobs,
          happiness: afterStats.happiness - beforeStats.happiness,
          coverage: afterStats.coverage - beforeStats.coverage,
          population: afterStats.population - beforeStats.population,
        }
    set({
      state,
      lastRejection: (rejected as StringKey) ?? null,
      lastChange,
      selectedPlantId: !rejected && action.type === 'demolish' ? null : get().selectedPlantId,
    })
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
