// Pure engine. reduce() returns new state or a rejection key — it never throws.
// Randomness comes only from the rng word carried in state; (seed, log) replays
// any game exactly. All numbers come from data.ts.

import * as D from './data'
import { rngNext } from './rng'
import type {
  Act,
  ActiveEffect,
  BuildableId,
  EventId,
  GameAction,
  GameOver,
  GameState,
  PlantInstance,
  ReduceResult,
  RegionId,
  RegionState,
  Season,
} from './types'

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

/** Start in spring (docs/02 §3); one turn = one quarter. */
export function seasonOf(turn: number): Season {
  return SEASONS[(turn - 1) % 4]
}

// Sim sets this true: any non-finite number then throws loudly instead of corrupting state.
export let STRICT = false
export function setStrict(v: boolean) {
  STRICT = v
}
function fin(x: number, label: string): number {
  if (STRICT && !Number.isFinite(x)) throw new Error(`non-finite ${label}: ${x}`)
  return x
}
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

// ------------------------------ init ------------------------------

function initRegion(id: RegionId): RegionState {
  const def = D.regionById(id)
  return {
    trust: def.baseTrust,
    prosperity: 0,
    demand: def.demandStart,
    coveredStreak: 0,
    eiaDone: false,
    communityActions: 0,
    hiring: false,
    revshare: false,
    blackouts: 0,
  }
}

export function createInitialState(seed: number, region: RegionId): GameState {
  return {
    v: 2,
    seed,
    rng: seed >>> 0,
    turn: 1,
    act: 1,
    actProgress: 0,
    regions: [region],
    regionState: { [region]: initRegion(region) },
    money: D.START_MONEY,
    dependence: D.START_DEPENDENCE,
    co2Avoided: 0,
    trackMWh: 0,
    prestige: 0,
    plants: [],
    nextPlantId: 1,
    storedMWh: 0,
    gasOn: true,
    surplusPolicy: 'store',
    gigsPending: 0,
    gigsThisTurn: 0,
    contract: null,
    euFulfilled: false,
    blackoutStreak: 0,
    effects: [],
    spotPrice: D.SPOT_START,
    hpp: { attempted: false, protested: false, protests: 0 },
    lastReport: null,
    gameOver: null,
    log: [],
  }
}

// ------------------------------ helpers ------------------------------

function hasEffect(state: GameState, id: EventId): boolean {
  return state.effects.some((e) => e.event === id && e.turnsLeft > 0)
}

function builtPlants(state: GameState): PlantInstance[] {
  return state.plants.filter((p) => p.turnsLeft === 0)
}

export function hasBuilt(state: GameState, type: BuildableId): boolean {
  return builtPlants(state).some((p) => p.type === type)
}

export function storageCapacity(state: GameState): number {
  return builtPlants(state)
    .filter((p) => D.BUILDABLES[p.type].kind === 'storage')
    .reduce((s, p) => s + D.BUILDABLES[p.type].baseOutput, 0)
}

export function slotOccupied(state: GameState, region: RegionId, slot: number): boolean {
  return state.plants.some((p) => p.region === region && p.slot === slot)
}

export function freeSlot(state: GameState, region: RegionId, type: BuildableId): number | null {
  const def = D.BUILDABLES[type]
  if (!def.slot) return null
  const slots = D.regionById(region).slots
  let best: number | null = null
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].type !== def.slot || slotOccupied(state, region, i)) continue
    if (best === null || slots[i].stars > slots[best].stars) best = i
  }
  return best
}

export function effectiveCost(state: GameState, type: BuildableId, region: RegionId): number {
  const def = D.BUILDABLES[type]
  let cost = def.cost * def.share
  if (def.kind === 'wind' || def.kind === 'offshore') cost *= D.REGION_WIND_COST_MULT[region] ?? 1
  if (type === 'cableshare' && hasEffect(state, 'euGrantCable')) {
    const avg = avgTrust(state)
    if (avg >= D.EUGRANT_TRUST) cost *= 1 - D.EUGRANT_CABLE_DISCOUNT
  }
  return Math.round(cost)
}

function avgTrust(state: GameState): number {
  const ts = state.regions.map((r) => state.regionState[r]!.trust)
  return ts.reduce((a, b) => a + b, 0) / ts.length
}

/** Why a build is unavailable, or null if legal. UI shows this on disabled buttons. */
export function buildRejection(state: GameState, type: BuildableId, region: RegionId, slot?: number): string | null {
  const def = D.BUILDABLES[type]
  const rdef = D.regionById(region)
  const rs = state.regionState[region]
  if (!rs) return 'rejRegionLocked'
  if (def.act > state.act) return 'rejAct'
  if (type === 'hpp') return 'rejUseHppFlow' // must go through the Namakhvani interstitial
  if (type === 'gig' && state.gigsThisTurn >= D.GIG_MAX_PER_TURN) return 'rejGigMax'
  if (state.money < effectiveCost(state, type, region)) return 'rejMoney'
  if (def.needsTrust !== undefined && rs.trust < def.needsTrust) return 'rejTrust'
  if (def.needsWind !== undefined && rdef.wind < def.needsWind) return 'rejWind'
  if (def.needsWater !== undefined && rdef.water < def.needsWater) return 'rejWater'
  if (def.needsTrack !== undefined && state.trackMWh < def.needsTrack) return 'rejTrack'
  if (def.needsCoast && !rdef.coast) return 'rejCoast'
  if (def.needsDependenceBelow !== undefined && state.dependence >= def.needsDependenceBelow) return 'rejDependence'
  if (def.needsAnyFarm && !builtPlants(state).some((p) => p.type === 'solarfarm' || p.type === 'windfarm' || p.type === 'turbine')) return 'rejNeedsFarm'
  if (def.maxPerRegion && state.plants.filter((p) => p.type === type && p.region === region).length >= def.maxPerRegion) return 'rejMax'
  if (def.slot) {
    const s = slot ?? freeSlot(state, region, type)
    if (s === null) return 'rejNoSlot'
    if (rdef.slots[s]?.type !== def.slot || slotOccupied(state, region, s)) return 'rejNoSlot'
  }
  return null
}

/** What the coming quarter looks like BEFORE endTurn: expected own generation
 *  (current effects, no new event) vs demand. Pure — the HUD dial reads this. */
export interface Forecast {
  demand: number // total, winter multipliers applied
  gen: number // your clean generation at this season
  storageAvail: number
  peakerAvail: number
  contractVolume: number // committed export served before home demand
}

export function forecast(state: GameState): Forecast {
  const season = seasonOf(state.turn)
  let demand = 0
  let gen = 0
  for (const r of state.regions) {
    const rs = state.regionState[r]!
    const winterExtra = season === 'winter' ? D.WINTER_DEMAND_MULT * (D.REGION_WINTER_DEMAND_EXTRA[r] ?? 1) : 1
    demand += rs.demand * winterExtra
    for (const p of builtPlants(state).filter((p) => p.region === r)) gen += plantOutput(state, p, season)
  }
  return {
    demand,
    gen,
    storageAvail: Math.min(state.storedMWh, storageCapacity(state)),
    peakerAvail: state.gasOn && hasBuilt(state, 'gaspeaker') ? D.GAS_PEAKER_CAP : 0,
    contractVolume: state.contract ? D.CONTRACTS[state.contract.customer].volume : 0,
  }
}

export function hppRejection(state: GameState, region: RegionId, choice: 'rush' | 'right'): string | null {
  const def = D.BUILDABLES.hpp
  const rdef = D.regionById(region)
  const rs = state.regionState[region]
  if (!rs) return 'rejRegionLocked'
  if (state.act < def.act) return 'rejAct'
  if (rdef.water < (def.needsWater ?? 0)) return 'rejWater'
  if (state.trackMWh < (def.needsTrack ?? 0)) return 'rejTrack'
  if (state.money < effectiveCost(state, 'hpp', region)) return 'rejMoney'
  if (freeSlot(state, region, 'hpp') === null) return 'rejNoSlot'
  if (choice === 'right') {
    const needTrust = D.HPP_TRUST_BASE + (D.REGION_HPP_TRUST_EXTRA[region] ?? 0)
    if (rs.trust < needTrust) return 'rejTrust'
    if (!rs.eiaDone) return 'rejEia'
    if (rs.communityActions < 2) return 'rejCommunity'
  }
  return null
}

// ------------------------------ reduce ------------------------------

export function reduce(state: GameState, action: GameAction): ReduceResult {
  if (state.gameOver) return { state, rejected: 'rejGameOver' }
  switch (action.type) {
    case 'build':
      return build(state, action)
    case 'buildHpp':
      return buildHpp(state, action)
    case 'trustAction':
      return trustAction(state, action)
    case 'toggleGas':
      return log({ ...state, gasOn: action.on }, action)
    case 'setSurplusPolicy':
      return log({ ...state, surplusPolicy: action.policy }, action)
    case 'expandRegion':
      return expandRegion(state, action)
    case 'signContract':
      return signContract(state, action)
    case 'endTurn':
      return { state: endTurn(state, action) }
  }
}

function log(state: GameState, action: GameAction): ReduceResult {
  return { state: { ...state, log: [...state.log, action] } }
}

function build(state: GameState, action: Extract<GameAction, { type: 'build' }>): ReduceResult {
  const { buildable: type, region } = action
  const rej = buildRejection(state, type, region, action.slot)
  if (rej) return { state, rejected: rej }
  const def = D.BUILDABLES[type]
  const cost = effectiveCost(state, type, region)
  const slot = def.slot ? (action.slot ?? freeSlot(state, region, type)!) : null

  if (type === 'gig') {
    return log(
      {
        ...state,
        money: state.money - cost,
        gigsPending: state.gigsPending + D.GIG_PAYOUT,
        gigsThisTurn: state.gigsThisTurn + 1,
      },
      action,
    )
  }

  const rs = state.regionState[region]!
  const trustBonus = def.trustOnBuild ?? 0
  const plant: PlantInstance = {
    id: state.nextPlantId,
    type,
    region,
    slot,
    turnsLeft: def.buildTurns ?? 0,
  }
  return log(
    {
      ...state,
      money: state.money - cost,
      plants: [...state.plants, plant],
      nextPlantId: state.nextPlantId + 1,
      regionState: {
        ...state.regionState,
        [region]: { ...rs, trust: clamp(rs.trust + trustBonus, 0, 100) },
      },
    },
    action,
  )
}

function buildHpp(state: GameState, action: Extract<GameAction, { type: 'buildHpp' }>): ReduceResult {
  const { region, choice } = action
  const rej = hppRejection(state, region, choice)
  if (rej) return { state, rejected: rej }
  const cost = effectiveCost(state, 'hpp', region)
  const slot = action.slot ?? freeSlot(state, region, 'hpp')!
  let next = { ...state, hpp: { ...state.hpp, attempted: true }, money: state.money - cost }

  if (choice === 'rush') {
    const roll = rngNext(next.rng)
    next = { ...next, rng: roll.next }
    if (roll.value < D.HPP_RUSH_PROTEST_CHANCE) {
      // Namakhvani plays out: construction frozen, 30% of invested capital burned, trust craters.
      const rs = next.regionState[region]!
      return log(
        {
          ...next,
          money: Math.round(next.money + cost * (1 - D.HPP_RUSH_CAPITAL_BURN)),
          hpp: { attempted: true, protested: true, protests: state.hpp.protests + 1 },
          effects: [...next.effects, { event: 'protest', turnsLeft: 1 }],
          regionState: {
            ...next.regionState,
            [region]: { ...rs, trust: clamp(rs.trust + D.HPP_RUSH_TRUST_HIT, 0, 100) },
          },
        },
        action,
      )
    }
  }

  const plant: PlantInstance = {
    id: next.nextPlantId,
    type: 'hpp',
    region,
    slot,
    turnsLeft: D.BUILDABLES.hpp.buildTurns ?? 2,
  }
  return log({ ...next, plants: [...next.plants, plant], nextPlantId: next.nextPlantId + 1 }, action)
}

function trustAction(state: GameState, action: Extract<GameAction, { type: 'trustAction' }>): ReduceResult {
  const def = D.TRUST_ACTIONS[action.action]
  const rs = state.regionState[action.region]
  if (!rs) return { state, rejected: 'rejRegionLocked' }
  if (state.money < def.cost) return { state, rejected: 'rejMoney' }
  if (def.id === 'eia' && rs.eiaDone) return { state, rejected: 'rejOnce' }
  if (def.id === 'hiring' && rs.hiring) return { state, rejected: 'rejOnce' }
  if (def.id === 'revshare' && rs.revshare) return { state, rejected: 'rejOnce' }

  const communityMult = def.community ? (D.REGION_COMMUNITY_MULT[action.region] ?? 1) : 1
  const gain = Math.round(def.trust * communityMult)
  return log(
    {
      ...state,
      money: state.money - def.cost,
      regionState: {
        ...state.regionState,
        [action.region]: {
          ...rs,
          trust: clamp(rs.trust + gain, 0, 100),
          communityActions: rs.communityActions + (def.community ? 1 : 0),
          eiaDone: rs.eiaDone || def.id === 'eia',
          hiring: rs.hiring || def.id === 'hiring',
          revshare: rs.revshare || def.id === 'revshare',
        },
      },
    },
    action,
  )
}

function expandRegion(state: GameState, action: Extract<GameAction, { type: 'expandRegion' }>): ReduceResult {
  if (state.act < 2) return { state, rejected: 'rejAct' }
  if (state.regions.length >= 2) return { state, rejected: 'rejMax' }
  if (state.regions.includes(action.region)) return { state, rejected: 'rejMax' }
  return log(
    {
      ...state,
      regions: [...state.regions, action.region],
      regionState: { ...state.regionState, [action.region]: initRegion(action.region) },
    },
    action,
  )
}

function signContract(state: GameState, action: Extract<GameAction, { type: 'signContract' }>): ReduceResult {
  if (state.contract) return { state, rejected: 'rejContractActive' }
  if (action.customer === 'armenia' && !hasBuilt(state, 'translink')) return { state, rejected: 'rejNeedsTranslink' }
  if (action.customer === 'eu' && !hasBuilt(state, 'cableshare')) return { state, rejected: 'rejNeedsCable' }
  const def = D.CONTRACTS[action.customer]
  return log(
    { ...state, contract: { customer: action.customer, quartersLeft: def.quarters, missed: 0 } },
    action,
  )
}

// ------------------------------ endTurn: the quarter resolution ------------------------------

interface RegionResolution {
  demand: number
  gen: number // own-region generation after all multipliers
  served: number // by YOU (own + imports + storage + peaker)
  fallback: number
  blackout: boolean
}

function plantOutput(state: GameState, p: PlantInstance, season: Season): number {
  const def = D.BUILDABLES[p.type]
  if (def.kind === 'storage' || def.kind === 'infra' || def.kind === 'gas') return 0
  const s = D.SEASON_TABLE[season]
  let mult: number
  switch (def.kind) {
    case 'solar':
      mult = s.solar * (D.REGION_SOLAR_MULT[p.region] ?? 1)
      if (hasEffect(state, 'hail')) mult *= D.HAIL_SOLAR_MULT
      if (hasEffect(state, 'cloudsSamegrelo') && p.region === 'samegrelo') mult *= D.CLOUDS_SOLAR_MULT
      break
    case 'hydro':
      mult = season === 'winter' ? (D.REGION_HYDRO_WINTER[p.region] ?? s.hydro) : s.hydro
      if (hasEffect(state, 'drought')) mult *= D.DROUGHT_HYDRO_MULT
      break
    case 'wind':
      mult = s.wind
      break
    case 'offshore':
      if (hasEffect(state, 'stormBS')) return 0
      mult = s.wind * (season === 'winter' ? D.OFFSHORE_WINTER_MULT : 1)
      break
  }
  const quality = p.slot !== null ? D.SLOT_QUALITY_MULT[D.regionById(p.region).slots[p.slot].stars] : 1
  const rs = state.regionState[p.region]!
  const awareness = rs.trust >= D.AWARENESS_TRUST ? D.AWARENESS_OUTPUT_MULT : 1
  return def.baseOutput * mult * quality * awareness
}

function drawEvent(state: GameState, season: Season): { event: EventId | null; rng: number } {
  let word = state.rng
  const roll = rngNext(word)
  word = roll.next
  if (roll.value >= D.EVENT_CHANCE) return { event: null, rng: word }

  const candidates = D.EVENTS.filter((e) => {
    if (e.needsSeason && e.needsSeason !== season) return false
    if (e.needsTranslink && !hasBuilt(state, 'translink')) return false
    if (e.needsOffshore && !hasBuilt(state, 'offshore')) return false
    if (e.needsAct && state.act < e.needsAct) return false
    if (e.needsSamegreloSolar) {
      const has = builtPlants(state).some(
        (p) => p.region === 'samegrelo' && D.BUILDABLES[p.type].kind === 'solar',
      )
      if (!has) return false
    }
    return true
  })
  if (candidates.length === 0) return { event: null, rng: word }

  const weightOf = (e: (typeof candidates)[number]) =>
    e.weight * (e.id === 'hail' ? (D.REGION_HAIL_WEIGHT_MULT[state.regions[0]] ?? 1) : 1)
  const total = candidates.reduce((s, e) => s + weightOf(e), 0)
  const pick = rngNext(word)
  word = pick.next
  let acc = pick.value * total
  for (const e of candidates) {
    acc -= weightOf(e)
    if (acc <= 0) return { event: e.id, rng: word }
  }
  return { event: candidates[candidates.length - 1].id, rng: word }
}

export function computeScore(state: GameState): { score: number; grade: 'S' | 'A' | 'B' | 'C' } {
  const trust = avgTrust(state)
  const score = Math.round(
    state.trackMWh / 10 + // MWh term scaled so grades stay meaningful at ~30k lifetime MWh
      trust * D.SCORE_TRUST_MULT +
      state.co2Avoided * D.SCORE_CO2_MULT +
      (100 - state.dependence) * D.SCORE_INDEPENDENCE_MULT +
      state.prestige * D.SCORE_PRESTIGE_MULT,
  )
  const grade = D.GRADES.find((g) => score >= g.min)!.grade
  return { score, grade }
}

function endTurn(prev: GameState, action: GameAction): GameState {
  const season = seasonOf(prev.turn)
  let state: GameState = { ...prev, log: [...prev.log, action] }

  // 0. Constructions advance; new event draws (event applies to THIS quarter).
  state.plants = state.plants.map((p) => (p.turnsLeft > 0 ? { ...p, turnsLeft: p.turnsLeft - 1 } : p))
  const draw = drawEvent(state, season)
  state.rng = draw.rng
  let effects: ActiveEffect[] = [...state.effects]
  if (draw.event) {
    const def = D.EVENTS.find((e) => e.id === draw.event)!
    effects = [...effects, { event: draw.event, turnsLeft: def.duration }]
  }
  state = { ...state, effects }

  // 1. Demand & generation per region.
  const res: Partial<Record<RegionId, RegionResolution>> = {}
  let totalDemand = 0
  let totalGen = 0
  const genByPlant = new Map<number, number>()
  for (const r of state.regions) {
    const rs = state.regionState[r]!
    const winterExtra = season === 'winter' ? D.WINTER_DEMAND_MULT * (D.REGION_WINTER_DEMAND_EXTRA[r] ?? 1) : 1
    const demand = rs.demand * winterExtra
    let gen = 0
    for (const p of builtPlants(state).filter((p) => p.region === r)) {
      const out = plantOutput(state, p, season)
      if (out > 0) genByPlant.set(p.id, out)
      gen += out
    }
    res[r] = { demand, gen, served: 0, fallback: 0, blackout: false }
    totalDemand += demand
    totalGen += gen
  }

  // 2. Contract export is served FIRST — a signed obligation (the over-commit lesson).
  let exported = 0
  let contractMissed = false
  let contract = state.contract
  let prestige = state.prestige
  let money = state.money
  let stored = Math.min(state.storedMWh, storageCapacity(state))
  let genForHome = totalGen
  let contractRevenue = 0
  if (contract) {
    const cdef = D.CONTRACTS[contract.customer]
    const fromGen = Math.min(cdef.volume, genForHome)
    let delivered = fromGen
    genForHome -= fromGen
    if (delivered < cdef.volume) {
      const fromStore = Math.min(cdef.volume - delivered, stored)
      stored -= fromStore
      delivered += fromStore
    }
    exported = delivered
    contractRevenue = delivered * cdef.price * 1000
    if (delivered + 0.5 < cdef.volume) {
      contractMissed = true
      money -= cdef.penalty
      prestige = Math.max(0, prestige - (contract.customer === 'eu' ? 1 : 0))
      contract = { ...contract, missed: contract.missed + 1, quartersLeft: contract.quartersLeft - 1 }
    } else {
      contract = { ...contract, quartersLeft: contract.quartersLeft - 1 }
    }
  }

  // 3. Home demand: own gen first, then cross-region transfer (8% loss, needs translink),
  //    then storage, then YOUR gas peaker, then the national fallback — else blackout.
  const genScale = totalGen > 0 ? genForHome / totalGen : 0
  let pool = 0 // surplus available for transfer
  for (const r of state.regions) {
    const rr = res[r]!
    const ownGen = rr.gen * genScale
    const ownServe = Math.min(rr.demand, ownGen)
    rr.served = ownServe
    pool += Math.max(0, ownGen - rr.demand)
  }
  const canTransfer = state.regions.length > 1 && hasBuilt(state, 'translink')
  for (const r of state.regions) {
    const rr = res[r]!
    let deficit = rr.demand - rr.served
    if (deficit > 0 && canTransfer && pool > 0) {
      const drawn = Math.min(pool, deficit / (1 - D.TRANSLINK_LOSS))
      pool -= drawn
      rr.served += drawn * (1 - D.TRANSLINK_LOSS)
      deficit = rr.demand - rr.served
    }
    if (deficit > 0 && stored > 0) {
      const fromStore = Math.min(stored, deficit)
      stored -= fromStore
      rr.served += fromStore
    }
  }
  // your peaker fills remaining deficits, up to capacity, if built and ON
  let gasUsed = 0
  const peakerCap = state.gasOn && hasBuilt(state, 'gaspeaker') ? D.GAS_PEAKER_CAP : 0
  for (const r of state.regions) {
    const rr = res[r]!
    const deficit = rr.demand - rr.served
    if (deficit > 0 && gasUsed < peakerCap) {
      const g = Math.min(deficit, peakerCap - gasUsed)
      gasUsed += g
      rr.served += g
    }
  }
  // national fallback (imported gas the region buys elsewhere — not your revenue)
  let fallbackUsed = 0
  const blackoutRegions: RegionId[] = []
  for (const r of state.regions) {
    const rr = res[r]!
    const deficit = rr.demand - rr.served
    if (deficit > 0.5) {
      const cap = rr.demand * (season === 'winter' ? D.FALLBACK_WINTER_FRAC : D.FALLBACK_FRAC)
      rr.fallback = Math.min(deficit, cap)
      fallbackUsed += rr.fallback
      if (deficit - rr.fallback > 0.5) {
        rr.blackout = true
        blackoutRegions.push(r)
      }
    }
  }

  // 4. Surplus: store, or sell at Turkish spot (needs translink); rest curtailed.
  let spotSold = 0
  let curtailed = 0
  let surplus = pool // untransferred surplus
  if (surplus > 0) {
    if (state.surplusPolicy === 'store') {
      const room = storageCapacity(state) - stored
      const charge = Math.min(room, surplus)
      stored += charge
      surplus -= charge
      curtailed = surplus
    } else if (hasBuilt(state, 'translink')) {
      spotSold = surplus
    } else {
      curtailed = surplus
    }
  }

  // 5. Money. Home + spot revenue blend per-plant PPA prices and co-investment shares.
  const priceMult = D.SEASON_TABLE[season].priceMult * (hasEffect(state, 'enguriLow') ? D.ENGURI_PRICE_MULT : 1)
  const homePrice = D.BASE_PRICE * 1000 * priceMult
  const homeServedFromGen = state.regions.reduce((s, r) => s + res[r]!.served, 0) - gasUsed
  // weighted revenue multiplier: each plant sells its share; PPA plants at their flat price
  let genRevenuePerMWh = homePrice
  let shareMult = 1
  if (totalGen > 0) {
    let priceAcc = 0
    let shareAcc = 0
    for (const p of builtPlants(state)) {
      const out = genByPlant.get(p.id) ?? 0
      if (out <= 0) continue
      const def = D.BUILDABLES[p.type]
      priceAcc += out * (def.ppaPrice !== undefined ? def.ppaPrice * 1000 : homePrice)
      shareAcc += out * def.share
    }
    genRevenuePerMWh = priceAcc / totalGen
    shareMult = shareAcc / totalGen
  }
  // regional hiring/revshare multipliers, weighted by served energy
  const totalServed = state.regions.reduce((s, r) => s + res[r]!.served, 0)
  let regionMult = 1
  if (totalServed > 0) {
    regionMult = state.regions.reduce((s, r) => {
      const rs = state.regionState[r]!
      const m = (rs.hiring ? 0.9 : 1) * (rs.revshare ? 0.85 : 1)
      return s + (res[r]!.served / totalServed) * m
    }, 0)
  }
  const spotPrice = state.spotPrice * (hasEffect(state, 'coldsnapTR') ? D.COLDSNAP_SPOT_MULT : 1)
  const gasMargin = gasUsed * homePrice // peaker energy sells at home price (fuel is a cost below)
  let revenue = (Math.max(0, homeServedFromGen) * genRevenuePerMWh + spotSold * spotPrice * 1000) * shareMult + contractRevenue * shareMult + gasMargin
  revenue *= regionMult

  const fuelMult = hasEffect(state, 'gasspike') ? D.GASSPIKE_FUEL_MULT : 1
  const upkeep = builtPlants(state).reduce((s, p) => s + D.BUILDABLES[p.type].upkeep * D.BUILDABLES[p.type].share, 0)
  const fuel = gasUsed * D.GAS_COST_PER_MWH * fuelMult
  let costs = upkeep + fuel
  if (hasEffect(state, 'inspection')) costs += Math.max(0, money) * D.INSPECTION_MONEY_FRAC
  money = Math.round(money + revenue - costs + state.gigsPending)

  // 6. CO₂, dependence, track.
  const cleanServed = Math.max(0, homeServedFromGen) + exported + spotSold
  const co2Avoided = Math.max(0, state.co2Avoided + cleanServed * D.CO2_PER_MWH - gasUsed * D.GAS_CO2_PER_MWH)
  const gasShare = totalDemand > 0 ? (gasUsed + fallbackUsed) / totalDemand : 0
  const depTarget = clamp(gasShare * 100, 0, 100)
  const dependence = clamp(
    Math.round(state.dependence + D.DEPENDENCE_CONVERGE * (depTarget - state.dependence)),
    0,
    100,
  )
  const trackMWh = state.trackMWh + totalGen + gasUsed

  // 7. Trust, prosperity, demand growth per region.
  const decayMult = hasEffect(state, 'elections') ? D.ELECTIONS_DECAY_MULT : 1
  const regionState: GameState['regionState'] = {}
  for (const r of state.regions) {
    const rs = state.regionState[r]!
    const rr = res[r]!
    let trust = rs.trust - D.TRUST_DECAY * decayMult
    if (rr.blackout) trust += D.BLACKOUT_TRUST_HIT
    if (hasEffect(state, 'viral') && r === state.regions[0]) trust += D.VIRAL_TRUST
    trust = clamp(trust, 0, 100)
    const fullyCovered = rr.served + 0.5 >= rr.demand
    let coveredStreak = fullyCovered ? rs.coveredStreak + 1 : 0
    let prosperity = rs.prosperity
    if (rr.blackout) prosperity = clamp(prosperity + D.BLACKOUT_PROSPERITY_HIT, 0, 5)
    else if (coveredStreak >= D.PROSPERITY_STREAK) {
      prosperity = clamp(prosperity + 1, 0, 5)
      coveredStreak = 0
    }
    const growth = 1 + D.DEMAND_GROWTH + D.DEMAND_GROWTH_PER_PROSPERITY * prosperity
    regionState[r] = {
      ...rs,
      trust,
      prosperity,
      coveredStreak,
      demand: rs.demand * growth,
      blackouts: rs.blackouts + (rr.blackout ? 1 : 0),
    }
  }

  // 8. Act progression.
  const home = state.regions[0]
  let act: Act = state.act
  let actProgress = state.actProgress
  let euFulfilled = state.euFulfilled
  if (act === 1) {
    const rr = res[home]!
    actProgress = rr.served + 0.5 >= rr.demand ? actProgress + 1 : 0
    if (actProgress >= D.ACT1_COVERED_QUARTERS) {
      act = 2
      actProgress = 0
    }
  } else if (act === 2) {
    const selfCovered = state.regions.every((r) => {
      const rr = res[r]!
      return rr.demand <= 0 || (rr.gen * genScale) / rr.demand >= D.ACT2_SELF_COVER
    })
    if (state.regions.length >= 2 && selfCovered && storageCapacity(state) >= D.ACT2_STORAGE_MWH) {
      act = 3
      actProgress = 0
    }
  }
  if (contract && contract.quartersLeft <= 0) {
    if (contract.customer === 'eu' && contract.missed === 0) euFulfilled = true
    contract = null
  }

  // 9. Spot price random-walk; effects tick down.
  const walk = rngNext(state.rng)
  const spotNext = clamp(state.spotPrice + (walk.value * 2 - 1) * D.SPOT_WALK, D.SPOT_MIN, D.SPOT_MAX)
  effects = effects.map((e) => ({ ...e, turnsLeft: e.turnsLeft - 1 })).filter((e) => e.turnsLeft > 0)

  // 10. End conditions.
  const blackoutStreak = blackoutRegions.length > 0 ? state.blackoutStreak + 1 : 0
  const turn = state.turn + 1
  const next: GameState = {
    ...state,
    rng: walk.next,
    turn,
    act,
    actProgress,
    regionState,
    money,
    dependence,
    co2Avoided: fin(co2Avoided, 'co2'),
    trackMWh: fin(trackMWh, 'track'),
    prestige,
    storedMWh: fin(Math.min(stored, storageCapacity(state)), 'stored'),
    gigsPending: 0,
    gigsThisTurn: 0,
    contract,
    euFulfilled,
    blackoutStreak,
    effects,
    spotPrice: spotNext,
    lastReport: {
      turn: state.turn,
      season,
      demand: Math.round(totalDemand),
      generated: Math.round(totalGen),
      gasUsed: Math.round(gasUsed),
      fallbackUsed: Math.round(fallbackUsed),
      blackoutRegions,
      exported: Math.round(exported),
      spotSold: Math.round(spotSold),
      curtailed: Math.round(curtailed),
      revenue: Math.round(revenue),
      costs: Math.round(costs),
      event: draw.event,
      contractMissed,
    },
    gameOver: null,
  }

  let gameOver: GameOver | null = null
  const { score, grade } = computeScore(next)
  if (euFulfilled) gameOver = { won: true, reason: 'euContract', score, grade }
  else if (money < 0) gameOver = { won: false, reason: 'bankrupt', score, grade }
  else if (next.regionState[home]!.trust <= 0) gameOver = { won: false, reason: 'trustZero', score, grade }
  else if (blackoutStreak >= D.MAX_BLACKOUT_STREAK) gameOver = { won: false, reason: 'blackouts', score, grade }
  else if (turn > D.MAX_TURNS) gameOver = { won: false, reason: 'maxTurns', score, grade }

  return { ...next, gameOver }
}
