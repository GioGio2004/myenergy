// Pure engine types. No DOM, no three, no Date, no Math.random anywhere in src/engine/.

export type RegionId =
  | 'kakheti'
  | 'kartli'
  | 'javakheti'
  | 'imereti'
  | 'racha'
  | 'adjara'
  | 'samegrelo'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Act = 1 | 2 | 3

export type GameAction =
  | { type: 'endTurn' }
  // M1 expands: build, trustAction, toggleGas, storeSurplus, sellExport, signContract…

export interface GameOver {
  won: boolean
  reason: string // strings.ts key
}

export interface GameState {
  v: 1 // save schema version
  seed: number
  rng: number // current mulberry32 word — randomness lives IN state
  turn: number // 1-based quarter, ends at MAX_TURNS
  act: Act
  regions: RegionId[] // unlocked regions, [0] = home
  money: number // integer GEL
  trust: Partial<Record<RegionId, number>> // 0–100
  prosperity: Partial<Record<RegionId, number>> // 0–5
  dependence: number // 0–100 imported-gas meter
  co2Avoided: number // tonnes
  gameOver: GameOver | null
  log: GameAction[] // replay log — (seed, log) reproduces any save
}

export interface ReduceResult {
  state: GameState
  /** strings.ts key — set when the action was rejected; state is then unchanged. Engine never throws. */
  rejected?: string
}
