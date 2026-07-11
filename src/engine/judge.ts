// Judge mode (docs/01 §2, 03 §10): ?act=2|3 jumps to a prepared midgame by
// replaying the balanced coast-aware bot deterministically — pure, no Date/random.

import { createInitialState, reduce } from './engine'
import { balancedCoastAware } from './bots'
import { MAX_TURNS } from './data'
import type { Act, GameState, RegionId } from './types'

export const JUDGE_SEED = 20260712 // demo day
export const JUDGE_REGION: RegionId = 'kartli'

export function judgeMidgame(seed: number, region: RegionId, act: Act): GameState {
  let state = createInitialState(seed, region)
  const bot = balancedCoastAware()
  let guard = 0
  while (state.act < act && !state.gameOver && state.turn <= MAX_TURNS && guard < 3000) {
    const action = bot(state)
    const { state: next, rejected } = reduce(state, action)
    state = rejected ? reduce(state, { type: 'endTurn' }).state : next
    guard++
  }
  return state
}
