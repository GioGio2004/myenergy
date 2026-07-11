// Headless strategy bots — pure functions over GameState. Used by sim/sim.ts to
// verify the balance targets in docs/02 §7, and by judge mode to fast-forward a
// prepared midgame deterministically. Bots return ONE next action (or endTurn);
// the runner applies actions until the bot says endTurn.

import * as D from './data'
import { buildRejection, hasBuilt, hppRejection, storageCapacity } from './engine'
import { rngNext } from './rng'
import type { BuildableId, GameAction, GameState, RegionId } from './types'

export type Bot = (state: GameState) => GameAction

const END: GameAction = { type: 'endTurn' }

function can(state: GameState, type: BuildableId, region: RegionId): boolean {
  return buildRejection(state, type, region) === null
}

function b(type: BuildableId, region: RegionId): GameAction {
  return { type: 'build', buildable: type, region }
}

/** Rough steady-state output of the player's fleet in a region (annual average). */
function genEstimate(state: GameState, region: RegionId): number {
  let total = 0
  for (const p of state.plants) {
    if (p.region !== region || p.turnsLeft > 0) continue
    const def = D.BUILDABLES[p.type]
    if (def.kind === 'storage' || def.kind === 'infra' || def.kind === 'gas') continue
    const quality = p.slot !== null ? D.SLOT_QUALITY_MULT[D.regionById(region).slots[p.slot].stars] : 1
    total += def.baseOutput * quality
  }
  return total
}

function pickSecondRegion(state: GameState): RegionId {
  const home = state.regions[0]
  const prefs: RegionId[] = ['kartli', 'kakheti', 'javakheti', 'adjara']
  return prefs.find((r) => r !== home) ?? 'javakheti'
}

function freeFieldSlots(state: GameState, region: RegionId): number {
  const slots = D.regionById(region).slots
  let free = 0
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].type === 'field' && !state.plants.some((p) => p.region === region && p.slot === i)) free++
  }
  return free
}

/** Generation ladder for one region: best affordable legal build, biggest first. */
function ladder(state: GameState, region: RegionId): GameAction | null {
  const order: BuildableId[] = ['windfarm', 'solarfarm', 'turbine', 'commsolar', 'rooftop']
  for (const type of order) {
    if (type === 'rooftop' && state.plants.some((p) => p.type === 'rooftop' && p.region === region)) continue
    // never spend the LAST field slot on commsolar — solarfarm needs it later
    if (
      type === 'commsolar' &&
      freeFieldSlots(state, region) <= 1 &&
      !state.plants.some((p) => p.type === 'solarfarm' && p.region === region)
    ) {
      continue
    }
    if (can(state, type, region)) return b(type, region)
  }
  return null
}

/** Toggle the peaker off while gas prices spike (fuel 396 > price 300 — pure loss). */
function gasDiscipline(state: GameState): GameAction | null {
  const spiking = state.effects.some((e) => e.event === 'gasspike')
  if (spiking && state.gasOn) return { type: 'toggleGas', on: false }
  if (!spiking && !state.gasOn) return { type: 'toggleGas', on: true }
  return null
}

/** The wettest unlocked region — where the HPP belongs. */
function hppTarget(state: GameState): RegionId {
  return [...state.regions].sort((a, c) => D.regionById(c).water - D.regionById(a).water)[0]
}

/** Winter output estimate — the season that breaks over-committers. */
function winterGenEstimate(state: GameState, region: RegionId): number {
  let total = 0
  for (const p of state.plants) {
    if (p.region !== region || p.turnsLeft > 0) continue
    const def = D.BUILDABLES[p.type]
    if (def.kind === 'storage' || def.kind === 'infra' || def.kind === 'gas') continue
    const s = D.SEASON_TABLE.winter
    const mult =
      def.kind === 'solar'
        ? s.solar
        : def.kind === 'hydro'
          ? (D.REGION_HYDRO_WINTER[region] ?? s.hydro)
          : def.kind === 'offshore'
            ? s.wind * D.OFFSHORE_WINTER_MULT
            : s.wind
    const quality = p.slot !== null ? D.SLOT_QUALITY_MULT[D.regionById(region).slots[p.slot].stars] : 1
    total += def.baseOutput * mult * quality
  }
  return total
}

// ------------------------------ balanced ------------------------------
// The reference strategy: gig-fund the early game, peaker as winter insurance,
// clean ladder to full coverage, trust groundwork early (in every region),
// HPP the RIGHT way, storage + 2nd region for Act II, cable + EU for the win.
export const balanced: Bot = (state) => {
  const home = state.regions[0]
  const rs = state.regionState[home]!
  const demand = rs.demand
  const covered = genEstimate(state, home) >= demand * 1.15
  const hppRegion = hppTarget(state)
  const wantHpp = D.regionById(hppRegion).water >= 7

  const gas = gasDiscipline(state)
  if (gas) return gas
  // cash engine while small
  if (state.act === 1 && state.money < 120000 && state.gigsThisTurn < D.GIG_MAX_PER_TURN && state.money >= D.GIG_COST + 500) {
    return b('gig', home)
  }
  // trust never sleeps — in EVERY unlocked region; the HPP region pushes to its gate
  for (const r of state.regions) {
    const rrs = state.regionState[r]!
    const isHppRegion = r === hppRegion && wantHpp && state.trackMWh >= 1000
    const goal = isHppRegion ? D.HPP_TRUST_BASE + (D.REGION_HPP_TRUST_EXTRA[r] ?? 0) + 3 : r === home ? 60 : 66
    if (rrs.trust < goal && state.money >= 3500) {
      return { type: 'trustAction', action: rrs.trust < goal - 6 ? 'school' : 'townhall', region: r }
    }
    if (isHppRegion) {
      if (rrs.communityActions < 2 && state.money >= 1000) return { type: 'trustAction', action: 'townhall', region: r }
      if (!rrs.eiaDone && state.money >= 20000) return { type: 'trustAction', action: 'eia', region: r }
    }
  }
  // winter insurance
  if (!hasBuilt(state, 'gaspeaker') && can(state, 'gaspeaker', home) && state.money >= 45000) {
    return b('gaspeaker', home)
  }
  // home generation ladder until comfortably covered
  if (!covered) {
    const build = ladder(state, home)
    if (build) return build
  }
  // Act II machinery
  if (state.act >= 2) {
    if (state.regions.length < 2) return { type: 'expandRegion', region: pickSecondRegion(state) }
    if (!hasBuilt(state, 'translink') && can(state, 'translink', home)) return b('translink', home)
    if (storageCapacity(state) < D.ACT2_STORAGE_MWH && can(state, 'battery', home)) return b('battery', home)
    const second = state.regions[1]
    if (second) {
      const srs = state.regionState[second]!
      if (genEstimate(state, second) < srs.demand * 1.05) {
        const build = ladder(state, second)
        if (build) return build
      }
    }
    // HPP, done right, in the wettest unlocked region
    if (wantHpp && !state.plants.some((p) => p.type === 'hpp') && hppRejection(state, hppRegion, 'right') === null && state.money >= 550000) {
      return { type: 'buildHpp', region: hppRegion, choice: 'right' }
    }
  }
  // Act III: cable + EU contract (sign only when even WINTER covers home + volume)
  if (state.act >= 3) {
    const landing = state.regions.find((r) => D.CABLE_LANDING.includes(r))
    if (!hasBuilt(state, 'cableshare') && landing && can(state, 'cableshare', landing)) {
      return b('cableshare', landing)
    }
    if (!state.contract && hasBuilt(state, 'cableshare') && !state.euFulfilled) {
      const winterGen = state.regions.reduce((s, r) => s + winterGenEstimate(state, r), 0)
      const winterDemand = state.regions.reduce((s, r) => {
        const d = state.regionState[r]!.demand
        return s + d * D.WINTER_DEMAND_MULT * (D.REGION_WINTER_DEMAND_EXTRA[r] ?? 1)
      }, 0)
      const buffer = storageCapacity(state) + (hasBuilt(state, 'gaspeaker') ? D.GAS_PEAKER_CAP : 0)
      if (winterGen + buffer > winterDemand + D.CONTRACTS.eu.volume * 1.05) {
        return { type: 'signContract', customer: 'eu' }
      }
      // not enough winter headroom yet — keep growing anywhere there's room
      for (const r of state.regions) {
        const grow = ladder(state, r)
        if (grow) return grow
      }
    }
  }
  // late-game surplus growth: keep building where affordable if rich
  if (state.money > 700000) {
    for (const r of state.regions) {
      const grow = ladder(state, r)
      if (grow) return grow
    }
  }
  return END
}

// Balanced, but the 2nd region and HPP prefer coastal landing for the cable —
// used when home region has no coast and no great expansion options. (Also the
// default: cableshare needs a coastal region unlocked.)
export function balancedCoastAware(): Bot {
  return (state) => {
    if (state.act >= 2 && state.regions.length < 2 && !state.regions.some((r) => D.CABLE_LANDING.includes(r))) {
      return { type: 'expandRegion', region: 'adjara' }
    }
    return balanced(state)
  }
}

// ------------------------------ gas crutch ------------------------------
// Peaker-covers-everything: the seductive wrong answer, played straight.
export const gasCrutch: Bot = (state) => {
  const home = state.regions[0]
  const rs = state.regionState[home]!
  if (state.gigsThisTurn < D.GIG_MAX_PER_TURN && state.money >= D.GIG_COST + 500 && state.money < 100000) {
    return b('gig', home)
  }
  if (rs.trust < 40 && state.money >= 1000) return { type: 'trustAction', action: 'townhall', region: home }
  if (!hasBuilt(state, 'gaspeaker') && can(state, 'gaspeaker', home)) return b('gaspeaker', home)
  if (!state.gasOn) return { type: 'toggleGas', on: true }
  return END
}

// ------------------------------ rush HPP ------------------------------
// Balanced economics, zero patience: no EIA, no community work, rushes the dam
// the moment it can pay for it. Namakhvani, the wrong way.
export const rushHpp: Bot = (state) => {
  const home = state.regions[0]
  const hppRegion = [...state.regions].sort((a, c) => D.regionById(c).water - D.regionById(a).water)[0]
  if (
    D.regionById(hppRegion).water >= 7 &&
    !state.plants.some((p) => p.type === 'hpp') &&
    hppRejection(state, hppRegion, 'rush') === null
  ) {
    return { type: 'buildHpp', region: hppRegion, choice: 'rush' }
  }
  // otherwise: balanced play minus the trust groundwork
  const rs = state.regionState[home]!
  const gas = gasDiscipline(state)
  if (gas) return gas
  if (state.act === 1 && state.money < 120000 && state.gigsThisTurn < D.GIG_MAX_PER_TURN && state.money >= D.GIG_COST + 500) {
    return b('gig', home)
  }
  if (rs.trust < 55 && state.money >= 1000) return { type: 'trustAction', action: 'townhall', region: home }
  if (!hasBuilt(state, 'gaspeaker') && can(state, 'gaspeaker', home) && state.money >= 45000) return b('gaspeaker', home)
  if (genEstimate(state, home) < rs.demand * 1.15) {
    const build = ladder(state, home)
    if (build) return build
  }
  return END
}

// ------------------------------ over-exporter ------------------------------
// Signs the EU contract with no storage headroom and sells every surplus MWh
// instead of storing it. Winter arrives; the contract is served first; home
// goes dark. The teachable failure.
export const overExporter: Bot = (state) => {
  if (state.surplusPolicy !== 'sell' && hasBuilt(state, 'translink')) return { type: 'setSurplusPolicy', policy: 'sell' }
  if (state.act >= 3) {
    const landing = state.regions.find((r) => D.CABLE_LANDING.includes(r))
    if (!hasBuilt(state, 'cableshare') && landing && can(state, 'cableshare', landing)) return b('cableshare', landing)
    if (hasBuilt(state, 'cableshare') && !state.contract && !state.euFulfilled) {
      return { type: 'signContract', customer: 'eu' } // no headroom check — that's the point
    }
  }
  const a = balancedCoastAware()(state)
  // never builds real headroom: no dam, no extra capacity once the cable exists
  if (a.type === 'buildHpp') return END
  if (hasBuilt(state, 'cableshare') && a.type === 'build' && a.buildable !== 'gig') return END
  return a
}

// ------------------------------ solar-only Samegrelo ------------------------------
// Copy-pastes a Kakheti strategy into the cloudiest region in Georgia.
export const solarOnly: Bot = (state) => {
  const home = state.regions[0]
  const rs = state.regionState[home]!
  if (state.gigsThisTurn < D.GIG_MAX_PER_TURN && state.money >= D.GIG_COST + 500 && state.money < 120000) {
    return b('gig', home)
  }
  if (rs.trust < 62 && state.money >= 3500) {
    return { type: 'trustAction', action: rs.trust < 55 ? 'school' : 'townhall', region: home }
  }
  for (const type of ['solarfarm', 'commsolar'] as BuildableId[]) {
    if (can(state, type, home)) return b(type, home)
  }
  if (!state.plants.some((p) => p.type === 'rooftop') && can(state, 'rooftop', home)) return b('rooftop', home)
  return END
}

// ------------------------------ random-legal fuzzer ------------------------------
export function randomLegal(fuzzSeed: number): Bot {
  let word = fuzzSeed >>> 0
  const rand = () => {
    const r = rngNext(word)
    word = r.next
    return r.value
  }
  return (state) => {
    if (rand() < 0.35) return END
    const region = state.regions[Math.floor(rand() * state.regions.length)]
    const roll = rand()
    if (roll < 0.35) {
      const types = Object.keys(D.BUILDABLES) as BuildableId[]
      return b(types[Math.floor(rand() * types.length)], region)
    }
    if (roll < 0.5) {
      const actions = ['townhall', 'school', 'eia', 'hiring', 'revshare'] as const
      return { type: 'trustAction', action: actions[Math.floor(rand() * actions.length)], region }
    }
    if (roll < 0.6) return { type: 'toggleGas', on: rand() < 0.5 }
    if (roll < 0.7) return { type: 'setSurplusPolicy', policy: rand() < 0.5 ? 'store' : 'sell' }
    if (roll < 0.8) {
      const all = D.REGIONS.map((r) => r.id)
      return { type: 'expandRegion', region: all[Math.floor(rand() * all.length)] }
    }
    if (roll < 0.9) return { type: 'signContract', customer: rand() < 0.5 ? 'armenia' : 'eu' }
    return { type: 'buildHpp', region, choice: rand() < 0.5 ? 'rush' : 'right' }
  }
}
