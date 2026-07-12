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

export type BuildableId =
  | 'rooftop'
  | 'gig'
  | 'commsolar'
  | 'smallhydro'
  | 'turbine'
  | 'gaspeaker'
  | 'solarfarm'
  | 'mediumhydro'
  | 'windfarm'
  | 'battery'
  | 'pumpedhydro'
  | 'translink'
  | 'hpp'
  | 'offshore'
  | 'cableshare'

export type SlotType = 'field' | 'ridge' | 'river' | 'coast'

export type TrustActionId = 'townhall' | 'school' | 'eia' | 'hiring' | 'revshare'

export type EventId =
  | 'hail'
  | 'drought'
  | 'elections'
  | 'viral'
  | 'inspection'
  | 'coldsnapTR'
  | 'enguriLow'
  | 'gasspike'
  | 'stormBS'
  | 'euGrantCable'
  | 'cloudsSamegrelo'
  | 'protest' // scripted — fired by rushed HPP, not by the weighted draw

export type CustomerId = 'turkey' | 'armenia' | 'eu'

export type GameAction =
  | { type: 'build'; buildable: BuildableId; region: RegionId; slot?: number }
  | { type: 'buildHpp'; region: RegionId; slot?: number; choice: 'rush' | 'right' }
  | { type: 'demolish'; plantId: number }
  | { type: 'trustAction'; action: TrustActionId; region: RegionId }
  | { type: 'toggleGas'; on: boolean }
  | { type: 'setSurplusPolicy'; policy: 'store' | 'sell' }
  | { type: 'expandRegion'; region: RegionId }
  | { type: 'signContract'; customer: 'armenia' | 'eu' }
  | { type: 'endTurn' }

export interface PlantInstance {
  id: number
  type: BuildableId
  region: RegionId
  slot: number | null // index into the region's slot table
  turnsLeft: number // >0 = under construction
}

export interface RegionState {
  trust: number // 0–100
  prosperity: number // 0–5
  demand: number // MWh/quarter, current
  coveredStreak: number // consecutive fully-self-covered quarters (prosperity +1 at 4)
  eiaDone: boolean
  communityActions: number // townhall/school count (HPP gate needs 2)
  hiring: boolean // +6 trust once, −10% revenue ongoing
  revshare: boolean // +12 trust once, −15% revenue ongoing
  blackouts: number // total, for stats
  unrestStreak: number // consecutive quarters of crisis-low happiness → people leave (read with ?? 0 for old saves)
}

export interface ActiveEffect {
  event: EventId
  turnsLeft: number
}

export interface ContractState {
  customer: 'armenia' | 'eu'
  quartersLeft: number
  missed: number
}

export interface GameOver {
  won: boolean
  reason: 'euContract' | 'maxTurns' | 'bankrupt' | 'trustZero' | 'blackouts'
  grade: 'S' | 'A' | 'B' | 'C'
  score: number
}

export interface TurnReport {
  turn: number
  season: Season
  demand: number
  generated: number // your generation incl. storage discharge
  gasUsed: number // your peaker MWh
  fallbackUsed: number // national grid (imported gas) MWh
  blackoutRegions: RegionId[]
  exported: number
  spotSold: number
  curtailed: number
  revenue: number
  costs: number
  event: EventId | null
  contractMissed: boolean
  unrestRegions: RegionId[] // regions where unhappy citizens dragged the quarter down
  importLevy: number // GEL you paid for leaning on the national grid this quarter
}

/** Read-only, immediately recalculated city feedback for the HUD and scene. */
export interface CityStats {
  population: number
  jobs: number
  happiness: number // 0-100
  coverage: number // forecast supply / demand, 0-100
  cleanShare: number // forecast renewable generation / demand, 0-100
  projectedRevenue: number // approximate gross next-quarter revenue, GEL
  projectedNet: number // approximate next-quarter operating result, GEL
  level: 1 | 2 | 3 | 4 | 5
}

export interface GameState {
  v: 3 // V2 living-city ruleset; older saves are intentionally not replayed
  seed: number
  rng: number // current mulberry32 word — randomness lives IN state
  turn: number // 1-based quarter, ends at MAX_TURNS
  act: Act
  actProgress: number // act-specific streak (Act I: covered quarters of 3)
  regions: RegionId[] // unlocked, [0] = home
  regionState: Partial<Record<RegionId, RegionState>>
  money: number // integer GEL
  dependence: number // 0–100 imported-gas meter
  co2Avoided: number // tonnes
  trackMWh: number // lifetime generated — gates big builds
  prestige: number
  plants: PlantInstance[]
  nextPlantId: number
  storedMWh: number // charge across all storage
  gasOn: boolean // peaker auto-fills deficit when true
  surplusPolicy: 'store' | 'sell'
  gigsPending: number // payouts arriving next turn (GEL)
  gigsThisTurn: number
  contract: ContractState | null
  euFulfilled: boolean
  blackoutStreak: number // consecutive quarters with ≥1 blackout — 3 = game over
  effects: ActiveEffect[]
  spotPrice: number // Turkey spot, GEL/kWh — random-walks each turn
  hpp: { attempted: boolean; protested: boolean; protests: number } // Namakhvani interstitial state
  lastReport: TurnReport | null
  gameOver: GameOver | null
  log: GameAction[] // replay log — (seed, log) reproduces any save
}

export interface ReduceResult {
  state: GameState
  /** strings.ts key — set when the action was rejected; state is then unchanged. Engine never throws. */
  rejected?: string
}
