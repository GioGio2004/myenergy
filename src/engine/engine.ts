// Pure engine. reduce() returns new state or a rejection key — it never throws.
// M0 ships the skeleton (init + turn advance); M1 replaces endTurn with the full
// quarter resolution per docs/01 §3 and docs/02.

import { MAX_TURNS, START_MONEY, regionById } from './data'
import type { GameAction, GameState, ReduceResult, RegionId, Season } from './types'

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

/** Start in spring (docs/02 §3); one turn = one quarter. */
export function seasonOf(turn: number): Season {
  return SEASONS[(turn - 1) % 4]
}

export function createInitialState(seed: number, region: RegionId): GameState {
  const def = regionById(region)
  return {
    v: 1,
    seed,
    rng: seed >>> 0,
    turn: 1,
    act: 1,
    regions: [region],
    money: START_MONEY,
    trust: { [region]: def.baseTrust },
    prosperity: { [region]: 0 },
    dependence: 0,
    co2Avoided: 0,
    gameOver: null,
    log: [],
  }
}

export function reduce(state: GameState, action: GameAction): ReduceResult {
  if (state.gameOver) return { state, rejected: 'comingM1' }
  switch (action.type) {
    case 'endTurn':
      return { state: endTurn(state, action) }
    default:
      return { state, rejected: 'comingM1' }
  }
}

// M1 will implement the real quarter resolution: demand vs generation, deficit
// (gas vs blackout), surplus (store vs export), trust decay, events, act gates.
function endTurn(state: GameState, action: GameAction): GameState {
  const turn = state.turn + 1
  return {
    ...state,
    turn,
    log: [...state.log, action],
    gameOver: turn > MAX_TURNS ? { won: false, reason: 'comingM1' } : null,
  }
}
