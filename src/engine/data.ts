// ALL game numbers live here (docs/02-BALANCE-DATA.md becomes this file verbatim).
// Tune HERE only — never special-case the engine (dev rules §5).

import type {
  BuildableId,
  CustomerId,
  EventId,
  RegionId,
  Season,
  SlotType,
  TrustActionId,
} from './types'

// ------------------------------ §1 Global constants ------------------------------
// V2 opening grant: the first meaningful clean-energy placement must happen in
// under a minute. The old ₾10k start forced several turns of repetitive gigs.
export const START_MONEY = 90000
export const MAX_TURNS = 36
export const BASE_PRICE = 0.3 // GEL/kWh → ×1000 = GEL/MWh
export const WINTER_PRICE_MULT = 1.4
export const AUTUMN_PRICE_MULT = 1.1
export const TRUST_DECAY = 2
export const CO2_PER_MWH = 0.4 // t avoided per clean MWh you serve
export const GAS_COST_PER_MWH = 220 // GEL — your peaker fuel
export const GAS_CO2_PER_MWH = 0.45
export const BLACKOUT_TRUST_HIT = -8
export const BLACKOUT_PROSPERITY_HIT = -1

// ---- Service quality → trust (the missing feedback loop) --------------------
// Serving your people with your OWN generation earns goodwill; leaning on the
// national grid (imported gas) quietly erodes it. This is what makes "build one
// panel and coast" slowly fail: low self-coverage bleeds trust faster than the
// flat decay, while genuinely covering demand rewards you.
export const SELF_COVER_TARGET = 0.85 // served-by-you / demand to earn goodwill
export const SELF_COVER_TRUST = 3 // trust gained when you clear the target
export const CLEAN_COVER_TRUST_BONUS = 2 // extra if that coverage is clean, not peaker gas
export const UNDERSERVE_TRUST_MAX = -3.5 // max trust lost when you barely self-serve
export const FALLBACK_RELIANCE_REF = 0.5 // fallback/demand at which the erosion maxes out

// ---- Mood consequences (unhappy citizens actually bite) ---------------------
// Happiness is no longer cosmetic. An unhappy region's economy underperforms
// (revenue drag), anger compounds (extra trust loss), and if neglect persists,
// people and investment leave (prosperity falls → population & demand shrink).
export const UNREST_HAPPY_LOW = 42 // below this: businesses pull back
export const UNREST_HAPPY_CRISIS = 26 // below this: real unrest
export const UNREST_REVENUE_MULT = 0.92 // revenue × this in an unhappy region
export const UNREST_REVENUE_MULT_CRISIS = 0.8 // …and worse in crisis
export const UNREST_TRUST_EXTRA = -2 // crisis anger compounds trust loss
export const UNREST_PROSPERITY_STREAK = 4 // crisis quarters in a row → −1 prosperity (exodus)

// ---- Import levy (leaning on the national grid isn't free) ------------------
// You pay a share of the imported-gas bill for what the national fallback covers,
// scaled by how import-dependent you already are — cheap early, punishing once
// you're hooked. Teaches the real cost of dependence; rewards building your own.
export const FALLBACK_LEVY_PER_MWH = 35 // GEL/MWh × (dependence/100)
// Dependence = smoothed imported-gas share of demand: it converges toward the
// quarter's actual gas share (your peaker + national fallback). The ±6/−3 step
// model in docs/02 §1 could not reach the cable gate (<40) inside 36 turns from
// the early all-fallback quarters — see DECISIONS.md; sim targets are the contract.
export const DEPENDENCE_CONVERGE = 0.25 // fraction of the gap closed per quarter
export const START_DEPENDENCE = 50 // Georgia imports ~100% of its gas — you start hooked

// National-grid fallback (the invisible imported-gas crutch that quietly covers
// what you don't — DECISIONS.md): fills any non-winter gap (feeding Dependence),
// but in WINTER it covers only a fraction of demand — Georgia's real winter
// deficit. Winter is when the region truly needs you.
export const FALLBACK_FRAC = 1.0 // × current demand, non-winter
export const FALLBACK_WINTER_FRAC = 0.55 // × current demand, winter

export const DEMAND_GROWTH = 0.03 // per quarter
export const DEMAND_GROWTH_PER_PROSPERITY = 0.01
export const WINTER_DEMAND_MULT = 1.3
export const PROSPERITY_STREAK = 4 // fully-covered quarters → +1 prosperity

export const GAS_PEAKER_CAP = 400 // MWh/q
export const GIG_COST = 2000
export const GIG_PAYOUT = 4500
export const GIG_MAX_PER_TURN = 2
export const TRANSLINK_LOSS = 0.08
export const AWARENESS_TRUST = 80
export const AWARENESS_OUTPUT_MULT = 1.1
export const HPP_RUSH_PROTEST_CHANCE = 0.65
export const HPP_RUSH_CAPITAL_BURN = 0.3
export const HPP_RUSH_TRUST_HIT = -15
export const HPP_TRUST_BASE = 75
export const MAX_BLACKOUT_STREAK = 3
export const DEMOLITION_COST_RATE = 0.12
export const DEMOLITION_CONSTRUCTION_RATE = 0.06

// V2 living-city feedback. These are presentation-scale estimates, kept here so
// the HUD, scene and action previews all tell the same deterministic story.
export const BASE_POPULATION = 850
export const POPULATION_PER_PROSPERITY = 420
export const POPULATION_PER_COVERED_QUARTER = 55
export const BASE_JOBS = 90
export const LOCAL_HIRING_JOBS = 70
export const REVENUE_SHARE_HAPPINESS = 5

// ---- Workforce / staffing (V3: "energy needs people, not just concrete") -----
// Every operational plant needs workers (≈ its JOBS_BY_BUILDABLE). A region has a
// labour pool that GROWS as it prospers and hires locally. Pack a region with
// generators but neglect its people and the pool can't run them — output drops.
// This is what stops "build one big plant and coast": you must keep developing
// (trust → prosperity → population, or the hiring policy) to staff what you build.
export const BASE_WORKFORCE = 120 // workers available before any prosperity/hiring
export const WORKFORCE_PER_PROSPERITY = 62 // each prosperity level adds this many workers
export const HIRING_WORKFORCE = 95 // the local-hiring policy adds a one-off labour boost
export const STAFFING_FLOOR = 0.55 // output never falls below this from understaffing alone
export const JOBS_BY_BUILDABLE: Record<BuildableId, number> = {
  rooftop: 4,
  gig: 0,
  commsolar: 24,
  smallhydro: 40,
  mediumhydro: 85,
  turbine: 18,
  gaspeaker: 16,
  solarfarm: 65,
  windfarm: 82,
  battery: 20,
  pumpedhydro: 70,
  translink: 34,
  hpp: 120,
  offshore: 95,
  cableshare: 40,
}

export const ACT1_COVERED_QUARTERS = 3 // meet 100% demand 3 consecutive quarters
export const ACT2_SELF_COVER = 0.9 // both regions ≥90% self-covered…
export const ACT2_STORAGE_MWH = 200 // …+ storage ≥200 MWh built
export const EU_CONTRACT_QUARTERS = 4

// Legacy Score = MWh + Trust×20 + CO₂×2 + (100−Dependence)×15 + Prestige×50
export const SCORE_TRUST_MULT = 20
export const SCORE_CO2_MULT = 2
export const SCORE_INDEPENDENCE_MULT = 15
export const SCORE_PRESTIGE_MULT = 50
export const GRADES: Array<{ min: number; grade: 'S' | 'A' | 'B' | 'C' }> = [
  { min: 14000, grade: 'S' },
  { min: 10000, grade: 'A' },
  { min: 6000, grade: 'B' },
  { min: 0, grade: 'C' },
]

// ------------------------------ §3 Seasons ------------------------------
export interface SeasonDef {
  solar: number
  hydro: number
  wind: number
  priceMult: number
}
export const SEASON_TABLE: Record<Season, SeasonDef> = {
  winter: { solar: 0.5, hydro: 0.6, wind: 1.1, priceMult: WINTER_PRICE_MULT },
  spring: { solar: 1.0, hydro: 1.4, wind: 1.0, priceMult: 1 },
  summer: { solar: 1.3, hydro: 0.9, wind: 0.8, priceMult: 1 },
  autumn: { solar: 0.9, hydro: 0.8, wind: 1.0, priceMult: AUTUMN_PRICE_MULT },
}
export const OFFSHORE_WINTER_MULT = 1.2

// ------------------------------ §2 Regions ------------------------------
export interface SlotDef {
  type: SlotType
  stars: 1 | 2 | 3
  whyKa: string
  whyEn: string
}

export interface RegionDef {
  id: RegionId
  nameKa: string
  nameEn: string
  sun: number
  wind: number
  water: number
  coast: boolean
  baseTrust: number
  demandStart: number // MWh/quarter
  quirkKa: string
  quirkEn: string
  slots: SlotDef[]
}

const WHY: Record<SlotType, Record<1 | 2 | 3, { ka: string; en: string }>> = {
  field: {
    3: { ka: 'სამხრეთის ველი — სრული მზე', en: 'south-facing field — full sun' },
    2: { ka: 'კარგი ველი — 100%', en: 'decent field — 100%' },
    1: { ka: 'ჩრდილოეთის ფერდობი — 60% გამომუშავება', en: 'north slope — 60% output' },
  },
  ridge: {
    3: { ka: 'ქარიანი ქედი — იდეალური', en: 'wind corridor ridge — ideal' },
    2: { ka: 'ქედი — სტაბილური ქარი', en: 'ridge — steady wind' },
    1: { ka: 'დაბალი გორაკი — სუსტი ქარი', en: 'low hill — weak wind' },
  },
  river: {
    3: { ka: 'მდინარის კანიონი — ძლიერი დინება', en: 'river canyon — strong flow' },
    2: { ka: 'მდინარე — კარგი დინება', en: 'river — good flow' },
    1: { ka: 'პატარა შენაკადი — მცირე დინება', en: 'small tributary — weak flow' },
  },
  coast: {
    3: { ka: 'ღია ზღვა — ძლიერი ბრიზი', en: 'open sea — strong breeze' },
    2: { ka: 'სანაპირო — კარგი ბრიზი', en: 'coast — good breeze' },
    1: { ka: 'დაცული ყურე — სუსტი ბრიზი', en: 'sheltered bay — weak breeze' },
  },
}

function slot(type: SlotType, stars: 1 | 2 | 3): SlotDef {
  return { type, stars, whyKa: WHY[type][stars].ka, whyEn: WHY[type][stars].en }
}

// Stars derive from region stats: ≥8 → [3,3,2] · 6–7 → [3,2,1] · 4–5 → [2,2,1] · ≤3 → [1,1,1]
function trio(type: SlotType, stat: number): SlotDef[] {
  const stars: Array<1 | 2 | 3> = stat >= 8 ? [3, 3, 2] : stat >= 6 ? [3, 2, 1] : stat >= 4 ? [2, 2, 1] : [1, 1, 1]
  return stars.map((s) => slot(type, s))
}

function regionSlots(sun: number, wind: number, water: number, coast: boolean): SlotDef[] {
  return [
    ...trio('field', sun),
    ...trio('ridge', wind),
    ...trio('river', water),
    ...(coast ? [slot('coast', wind >= 5 ? 2 : 1)] : []),
  ]
}

export const REGIONS: RegionDef[] = [
  { id: 'kakheti', nameKa: 'კახეთი', nameEn: 'Kakheti', sun: 9, wind: 4, water: 3, coast: false, baseTrust: 60, demandStart: 600, quirkKa: 'სეტყვის რისკი ×2', quirkEn: 'hail chance ×2', slots: regionSlots(9, 4, 3, false) },
  { id: 'kartli', nameKa: 'ქართლი', nameEn: 'Kartli', sun: 6, wind: 9, water: 4, coast: false, baseTrust: 65, demandStart: 650, quirkKa: 'ქარი −10% ღირებულება (გორის პრეცედენტი)', quirkEn: 'wind −10% cost (Gori precedent)', slots: regionSlots(6, 9, 4, false) },
  { id: 'javakheti', nameKa: 'სამცხე-ჯავახეთი', nameEn: 'Javakheti', sun: 7, wind: 8, water: 5, coast: false, baseTrust: 55, demandStart: 550, quirkKa: 'ზამთრის მოთხოვნა ×1.25 (მკაცრი)', quirkEn: 'winter demand ×1.25 (harsh)', slots: regionSlots(7, 8, 5, false) },
  { id: 'imereti', nameKa: 'იმერეთი', nameEn: 'Imereti', sun: 5, wind: 4, water: 8, coast: false, baseTrust: 45, demandStart: 700, quirkKa: 'ჰესს +10 ნდობა სჭირდება (ნამახვანი)', quirkEn: 'hydro needs +10 trust (Namakhvani)', slots: regionSlots(5, 4, 8, false) },
  { id: 'racha', nameKa: 'რაჭა', nameEn: 'Racha', sun: 4, wind: 3, water: 9, coast: false, baseTrust: 40, demandStart: 350, quirkKa: 'ჰესს +10 ნდობა; სათემო ქმედებები ×1.5', quirkEn: 'hydro +10 trust; community actions ×1.5', slots: regionSlots(4, 3, 9, false) },
  { id: 'adjara', nameKa: 'აჭარა', nameEn: 'Adjara', sun: 4, wind: 5, water: 7, coast: true, baseTrust: 50, demandStart: 600, quirkKa: 'მზე −10%; კაბელის ნაპირი', quirkEn: 'solar −10%; cable landing', slots: regionSlots(4, 5, 7, true) },
  { id: 'samegrelo', nameKa: 'სამეგრელო-ზემო სვანეთი ', nameEn: 'Samegrelo-Zemo Svaneti', sun: 3, wind: 5, water: 8, coast: true, baseTrust: 55, demandStart: 620, quirkKa: 'მზის ხაფანგი — ღრუბლიანი', quirkEn: 'the solar trap — cloudy', slots: regionSlots(3, 5, 8, true) },
]

export function regionById(id: RegionId): RegionDef {
  return REGIONS.find((r) => r.id === id)!
}

// Region quirk knobs (data, not engine special-cases)
export const REGION_SOLAR_MULT: Partial<Record<RegionId, number>> = { adjara: 0.9 }
export const REGION_HYDRO_WINTER: Partial<Record<RegionId, number>> = { adjara: 0.8 } // instead of 0.6
export const REGION_WIND_COST_MULT: Partial<Record<RegionId, number>> = { kartli: 0.9 }
export const REGION_WINTER_DEMAND_EXTRA: Partial<Record<RegionId, number>> = { javakheti: 1.25 }
export const REGION_COMMUNITY_MULT: Partial<Record<RegionId, number>> = { racha: 1.5 }
export const REGION_HPP_TRUST_EXTRA: Partial<Record<RegionId, number>> = { imereti: 10, racha: 10 }
export const REGION_HAIL_WEIGHT_MULT: Partial<Record<RegionId, number>> = { kakheti: 2 }
export const CABLE_LANDING: RegionId[] = ['adjara', 'samegrelo']

// ------------------------------ §4 Buildables ------------------------------
export type EnergyKind = 'solar' | 'wind' | 'hydro' | 'gas' | 'offshore' | 'storage' | 'infra'

export interface BuildableDef {
  id: BuildableId
  act: 1 | 2 | 3
  cost: number // total project cost
  share: number // YOUR share: you pay cost×share, you earn share of its revenue (co-investment, DECISIONS.md)
  slot: SlotType | null
  kind: EnergyKind
  baseOutput: number // MWh/q (storage: capacity)
  upkeep: number // GEL/q
  needsTrust?: number
  needsWind?: number
  needsWater?: number
  needsTrack?: number
  needsAnyFarm?: boolean
  needsCoast?: boolean
  needsDependenceBelow?: number
  ppaPrice?: number // GEL/kWh, overrides season price for this plant
  buildTurns?: number
  trustOnBuild?: number
  maxPerRegion?: number
  runOfRiver?: boolean // no reservoir → extra winter collapse (the real Georgian import driver)
}

// Run-of-river plants have no storage reservoir, so their winter output collapses
// further than a regulated dam's — this is *why* Georgia imports power each winter.
export const RUNOFRIVER_WINTER_MULT = 0.5

export const BUILDABLES: Record<BuildableId, BuildableDef> = {
  // rooftop & gaspeaker sit in the village, not on siting slots (DECISIONS.md)
  rooftop: { id: 'rooftop', act: 1, cost: 10000, share: 1, slot: null, kind: 'solar', baseOutput: 8, upkeep: 0, maxPerRegion: 6 },
  gig: { id: 'gig', act: 1, cost: GIG_COST, share: 1, slot: null, kind: 'infra', baseOutput: 0, upkeep: 0 },
  commsolar: { id: 'commsolar', act: 1, cost: 60000, share: 1, slot: 'field', kind: 'solar', baseOutput: 140, upkeep: 700, needsTrust: 50, trustOnBuild: 3, buildTurns: 1 },
  // Small run-of-river HES — every region has a stream (river site), so it's the
  // universal clean starter. Cheap & fully yours, but no reservoir → dies in winter.
  smallhydro: { id: 'smallhydro', act: 1, cost: 85000, share: 1, slot: 'river', kind: 'hydro', baseOutput: 380, upkeep: 1250, runOfRiver: true, maxPerRegion: 2, buildTurns: 1 },
  turbine: { id: 'turbine', act: 1, cost: 120000, share: 1, slot: 'ridge', kind: 'wind', baseOutput: 320, upkeep: 2000, needsTrust: 55, needsWind: 6, buildTurns: 1 },
  gaspeaker: { id: 'gaspeaker', act: 1, cost: 40000, share: 1, slot: null, kind: 'gas', baseOutput: GAS_PEAKER_CAP, upkeep: 1100, maxPerRegion: 1, buildTurns: 1 },
  solarfarm: { id: 'solarfarm', act: 1, cost: 300000, share: 0.6, slot: 'field', kind: 'solar', baseOutput: 1300, upkeep: 5400, needsTrust: 60, needsTrack: 500, ppaPrice: 0.28, buildTurns: 2 },
  // Medium regulated HES — only where the rivers are genuinely strong (water ≥ 6:
  // Imereti, Racha, Adjara, Samegrelo). Bigger and steadier through winter than run-of-river.
  mediumhydro: { id: 'mediumhydro', act: 2, cost: 450000, share: 0.6, slot: 'river', kind: 'hydro', baseOutput: 2200, upkeep: 7500, needsTrust: 60, needsWater: 6, needsTrack: 1500, buildTurns: 2 },
  windfarm: { id: 'windfarm', act: 2, cost: 900000, share: 0.5, slot: 'ridge', kind: 'wind', baseOutput: 3800, upkeep: 16000, needsTrust: 65, needsWind: 7, needsTrack: 1500, buildTurns: 2 },
  battery: { id: 'battery', act: 1, cost: 150000, share: 1, slot: null, kind: 'storage', baseOutput: 250, upkeep: 1400, needsAnyFarm: true, maxPerRegion: 2, buildTurns: 1 },
  pumpedhydro: { id: 'pumpedhydro', act: 2, cost: 400000, share: 0.6, slot: 'river', kind: 'storage', baseOutput: 800, upkeep: 3400, needsWater: 7, needsTrust: 60, buildTurns: 2 },
  translink: { id: 'translink', act: 2, cost: 250000, share: 0.7, slot: null, kind: 'infra', baseOutput: 0, upkeep: 2700, maxPerRegion: 1, buildTurns: 1 },
  hpp: { id: 'hpp', act: 2, cost: 2000000, share: 0.25, slot: 'river', kind: 'hydro', baseOutput: 6500, upkeep: 20000, needsTrust: HPP_TRUST_BASE, needsWater: 7, needsTrack: 3000, buildTurns: 2 },
  offshore: { id: 'offshore', act: 3, cost: 1200000, share: 0.4, slot: 'coast', kind: 'offshore', baseOutput: 4200, upkeep: 24000, needsTrust: 70, needsTrack: 4000, needsCoast: true, buildTurns: 2 },
  cableshare: { id: 'cableshare', act: 3, cost: 1500000, share: 0.15, slot: null, kind: 'infra', baseOutput: 0, upkeep: 6800, needsTrack: 6000, needsDependenceBelow: 40, needsCoast: true, maxPerRegion: 1, buildTurns: 1 },
}

export const SLOT_QUALITY_MULT: Record<1 | 2 | 3, number> = { 1: 0.6, 2: 1.0, 3: 1.3 }

// ------------------------------ Trust actions ------------------------------
export interface TrustActionDef {
  id: TrustActionId
  cost: number
  trust: number
  community: boolean // counts toward the HPP community-actions gate
  revenueMult?: number // ongoing revenue multiplier once active
  once?: boolean
}
export const TRUST_ACTIONS: Record<TrustActionId, TrustActionDef> = {
  townhall: { id: 'townhall', cost: 500, trust: 5, community: true },
  school: { id: 'school', cost: 3000, trust: 10, community: true },
  eia: { id: 'eia', cost: 8000, trust: 8, community: false, once: true },
  hiring: { id: 'hiring', cost: 0, trust: 6, community: false, revenueMult: 0.9, once: true },
  revshare: { id: 'revshare', cost: 0, trust: 12, community: false, revenueMult: 0.85, once: true },
}

// ------------------------------ §5 Export contracts ------------------------------
export interface ContractDef {
  customer: CustomerId
  price: number // GEL/kWh (turkey: spot, see SPOT_*)
  volume: number // MWh/q
  quarters: number
  penalty: number // GEL per missed quarter
}
export const CONTRACTS: Record<'armenia' | 'eu', ContractDef> = {
  armenia: { customer: 'armenia', price: 0.28, volume: 300, quarters: 4, penalty: 20000 },
  eu: { customer: 'eu', price: 0.48, volume: 1200, quarters: 4, penalty: 80000 },
}
export const SPOT_MIN = 0.25
export const SPOT_MAX = 0.55
export const SPOT_START = 0.35
export const SPOT_WALK = 0.06 // max step per quarter

// ------------------------------ §6 Events ------------------------------
export interface EventDef {
  id: EventId
  weight: number
  duration: number // turns the effect lasts
  // conditions checked by the engine against state:
  needsTranslink?: boolean
  needsSeason?: Season
  needsOffshore?: boolean
  needsAct?: 2 | 3
  needsSamegreloSolar?: boolean
}
export const EVENTS: EventDef[] = [
  { id: 'hail', weight: 2, duration: 1 },
  { id: 'drought', weight: 2, duration: 1 },
  { id: 'elections', weight: 1, duration: 2 },
  { id: 'viral', weight: 1, duration: 1 },
  { id: 'inspection', weight: 1, duration: 1 },
  { id: 'coldsnapTR', weight: 2, duration: 1, needsTranslink: true, needsSeason: 'winter' },
  { id: 'enguriLow', weight: 2, duration: 1, needsSeason: 'spring' },
  { id: 'gasspike', weight: 2, duration: 2 },
  { id: 'stormBS', weight: 2, duration: 1, needsOffshore: true },
  { id: 'euGrantCable', weight: 1, duration: 1, needsAct: 3 },
  { id: 'cloudsSamegrelo', weight: 3, duration: 1, needsSamegreloSolar: true },
]
export const EVENT_CHANCE = 0.55 // chance a quarter draws an event at all

// Event effect knobs
export const HAIL_SOLAR_MULT = 0.5
export const DROUGHT_HYDRO_MULT = 0.6
export const ELECTIONS_DECAY_MULT = 2
export const VIRAL_TRUST = 8
export const INSPECTION_MONEY_FRAC = 0.05
export const COLDSNAP_SPOT_MULT = 2
export const ENGURI_PRICE_MULT = 1.3
export const GASSPIKE_FUEL_MULT = 1.8
export const CLOUDS_SOLAR_MULT = 0.6 // −40%
export const EUGRANT_CABLE_DISCOUNT = 0.3 // needs avg trust ≥70
export const EUGRANT_TRUST = 70
