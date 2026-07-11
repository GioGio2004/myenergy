// Headless bot suite + fuzzer per docs/02 §7. Run: npx tsx sim/sim.ts
// Red sim = fix before anything else; balance failures are fixed in data.ts.

import { balancedCoastAware, gasCrutch, overExporter, randomLegal, rushHpp, solarOnly, type Bot } from '../src/engine/bots'
import { createInitialState, demolitionCost, reduce, setStrict, storageCapacity } from '../src/engine/engine'
import * as D from '../src/engine/data'
import type { GameState, RegionId } from '../src/engine/types'

setStrict(true)

const EASY: RegionId[] = ['kakheti', 'kartli', 'javakheti', 'adjara']
const HARD: RegionId[] = ['imereti', 'racha', 'samegrelo']
const ALL: RegionId[] = [...EASY, ...HARD]

interface RunStats {
  state: GameState
  turns: number
  wonBy34: boolean
  act1DoneAtTurn: number | null
  protests: number
  hppAttempts: number
  euSigned: boolean
  homeBlackoutDuringContract: boolean
  profitNormal: number
  profitSpike: number
  spikeExtraFuel: number
  sawSpike: boolean
}

function runGame(seed: number, region: RegionId, bot: Bot): RunStats {
  let state = createInitialState(seed, region)
  const stats: RunStats = {
    state,
    turns: 0,
    wonBy34: false,
    act1DoneAtTurn: null,
    protests: 0,
    hppAttempts: 0,
    euSigned: false,
    homeBlackoutDuringContract: false,
    profitNormal: 0,
    profitSpike: 0,
    spikeExtraFuel: 0,
    sawSpike: false,
  }
  let guard = 0
  while (!state.gameOver && guard++ < 2000) {
    // pre-turn actions until the bot ends the turn (or repeats itself/errors)
    let acts = 0
    for (;;) {
      const action = bot(state)
      if (action.type === 'endTurn' || acts++ > 30) break
      if (action.type === 'signContract' && action.customer === 'eu') stats.euSigned = true
      const before = state
      const r = reduce(state, action)
      state = r.state
      if (r.rejected) {
        state = before
        break // bot proposed something illegal — stop acting this turn
      }
      if (action.type === 'buildHpp') stats.hppAttempts++ // legal attempts only
    }
    const spiked = state.effects.some((e) => e.event === 'gasspike')
    const hadContract = Boolean(state.contract)
    const r = reduce(state, { type: 'endTurn' })
    state = r.state
    const rep = state.lastReport!
    const spikedNow = spiked || rep.event === 'gasspike'
    const profit = rep.revenue - rep.costs
    if (spikedNow) {
      stats.profitSpike += profit
      stats.spikeExtraFuel += rep.gasUsed * D.GAS_COST_PER_MWH * (D.GASSPIKE_FUEL_MULT - 1)
      stats.sawSpike = true
    } else {
      stats.profitNormal += profit
    }
    if (hadContract && rep.blackoutRegions.length > 0) stats.homeBlackoutDuringContract = true
    if (stats.act1DoneAtTurn === null && state.act >= 2) stats.act1DoneAtTurn = rep.turn
  }
  stats.protests = state.hpp.protests // engine-side counter is exact
  stats.state = state
  stats.turns = state.turn - 1
  stats.wonBy34 = Boolean(state.gameOver?.won) && state.turn - 1 <= 34
  return stats
}

function pct(n: number, d: number): string {
  return d === 0 ? '—' : `${Math.round((n / d) * 100)}%`
}

let failures = 0
function target(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? '✅' : '❌'} ${name} — ${detail}`)
  if (!ok) failures++
}

const SEEDS = Number(process.env.SIM_SEEDS ?? 300)
const t0 = performance.now()

// ---- 1. Balanced bot completes Act III ≤34 turns: ≥60% easy, ≥35% hard ----
{
  const rates: Record<string, number> = {}
  for (const region of ALL) {
    let wins = 0
    for (let s = 0; s < SEEDS; s++) if (runGame(1000 + s, region, balancedCoastAware()).wonBy34) wins++
    rates[region] = wins / SEEDS
  }
  const easyMin = Math.min(...EASY.map((r) => rates[r]))
  const hardMin = Math.min(...HARD.map((r) => rates[r]))
  target(
    '1 balanced wins ≤34t',
    easyMin >= 0.6 && hardMin >= 0.35,
    ALL.map((r) => `${r}:${Math.round(rates[r] * 100)}%`).join(' '),
  )
}

// ---- 2. Gas-crutch bot: survives, Dependence >70, grade ≤B, spikes bite ≥25% ----
{
  let survived = 0
  let depHigh = 0
  let gradeLeB = 0
  let spikeBite = 0
  let sawSpike = 0
  const N = 200
  for (let s = 0; s < N; s++) {
    const st = runGame(2000 + s, 'kakheti', gasCrutch)
    const go = st.state.gameOver!
    if (go.reason === 'maxTurns' || go.won) survived++
    if (st.state.dependence > 70) depHigh++
    if (go.grade !== 'S' && go.grade !== 'A') gradeLeB++
    if (st.sawSpike) {
      sawSpike++
      const total = st.profitNormal + st.profitSpike
      if (total > 0 && st.spikeExtraFuel >= 0.25 * total) spikeBite++
      else if (total <= 0) spikeBite++ // spikes pushed the whole run into the red — bite confirmed
    }
  }
  target(
    '2 gas-crutch trap',
    survived / N >= 0.6 && depHigh / N >= 0.9 && gradeLeB / N >= 0.95 && (sawSpike === 0 || spikeBite / sawSpike >= 0.5),
    `survive:${pct(survived, N)} dep>70:${pct(depHigh, N)} ≤B:${pct(gradeLeB, N)} spikeBite:${pct(spikeBite, sawSpike)}`,
  )
}

// ---- 3. Rush-HPP bot: protest ≥55% of attempts, ends ≤C in most runs ----
{
  let attempts = 0
  let protests = 0
  let lowGrade = 0
  const N = 200
  for (let s = 0; s < N; s++) {
    const st = runGame(3000 + s, 'imereti', rushHpp)
    attempts += st.hppAttempts
    protests += st.protests
    const go = st.state.gameOver!
    if (go.grade === 'C' || !go.won) lowGrade++
  }
  target(
    '3 rush-HPP protest',
    attempts > 0 && protests / attempts >= 0.55 && lowGrade / N >= 0.5,
    `protest/attempt:${pct(protests, attempts)} (${protests}/${attempts}) ≤C-or-lost:${pct(lowGrade, N)}`,
  )
}

// ---- 4. Over-exporter: ≥1 home blackout during contract in ≥70% of signed runs ----
{
  let signed = 0
  let bitten = 0
  const N = 200
  for (let s = 0; s < N; s++) {
    const st = runGame(4000 + s, 'kakheti', overExporter) // winter-weak solar region
    if (st.euSigned) {
      signed++
      if (st.homeBlackoutDuringContract) bitten++
    }
  }
  target('4 over-exporter pays', signed >= 20 && bitten / signed >= 0.7, `signed:${signed} blackout-during-contract:${pct(bitten, signed)}`)
}

// ---- 5. Solar-only in Samegrelo: Act I incomplete at turn 10 in ≥80% ----
{
  let failed = 0
  const N = 200
  for (let s = 0; s < N; s++) {
    const st = runGame(5000 + s, 'samegrelo', solarOnly)
    const failedAct1 = st.act1DoneAtTurn === null || st.act1DoneAtTurn > 10
    if (failedAct1) failed++
  }
  target('5 samegrelo solar trap', failed / N >= 0.8, `act1-not-done-by-t10:${pct(failed, N)}`)
}

// ---- 6. Fuzzer: 2000 random-legal games, invariants hold ----
{
  let ok = true
  let detail = 'clean'
  outer: for (let s = 0; s < 2000; s++) {
    const region = ALL[s % ALL.length]
    try {
      const st = runGame(6000 + s, region, randomLegal(s * 7 + 1))
      const g = st.state
      const checks: Array<[boolean, string]> = [
        [g.turn <= D.MAX_TURNS + 1, 'terminates ≤36'],
        [Number.isFinite(g.money), 'money finite'],
        [g.money >= 0 || g.gameOver !== null, 'no negative money without gameover'],
        [g.dependence >= 0 && g.dependence <= 100, 'dependence 0–100'],
        [g.regions.every((r) => g.regionState[r]!.trust >= 0 && g.regionState[r]!.trust <= 100), 'trust 0–100'],
        [g.gameOver !== null, 'game ends'],
      ]
      for (const [pass, label] of checks) {
        if (!pass) {
          ok = false
          detail = `seed ${6000 + s} ${region}: ${label}`
          break outer
        }
      }
    } catch (e) {
      ok = false
      detail = `seed ${6000 + s} ${region}: THREW ${(e as Error).message}`
      break
    }
  }
  target('6 fuzzer invariants', ok, detail)
}

// ---- 7. Determinism: replaying (seed, log) reproduces the exact final state ----
{
  let ok = true
  for (let s = 0; s < 20 && ok; s++) {
    const st = runGame(7000 + s, 'kartli', balancedCoastAware())
    let replay = createInitialState(7000 + s, 'kartli')
    for (const a of st.state.log) replay = reduce(replay, a).state
    ok = replay.money === st.state.money && replay.turn === st.state.turn && replay.rng === st.state.rng
  }
target('7 determinism', ok, ok ? 'replay identical' : 'replay diverged')
}

// ---- 8. V2 land + demolition: full plots reject, removal costs, storage clamps ----
{
  let state: GameState = { ...createInitialState(8000, 'kakheti'), money: 2_000_000 }
  for (const slot of [0, 1, 2]) state = reduce(state, { type: 'build', buildable: 'commsolar', region: 'kakheti', slot }).state
  const full = reduce(state, { type: 'build', buildable: 'commsolar', region: 'kakheti' })
  const plant = state.plants[0]
  const cost = demolitionCost(state, plant.id)
  const beforeMoney = state.money
  const removed = reduce(state, { type: 'demolish', plantId: plant.id })

  let storageState: GameState = { ...removed.state, money: 2_000_000, trackMWh: 1_000 }
  storageState = reduce(storageState, { type: 'build', buildable: 'solarfarm', region: 'kakheti', slot: plant.slot ?? 0 }).state
  const batteryBuild = reduce(storageState, { type: 'build', buildable: 'battery', region: 'kakheti' })
  storageState = batteryBuild.state
  const battery = storageState.plants.find((p) => p.type === 'battery')
  if (battery) storageState = { ...storageState, storedMWh: storageCapacity(storageState) }
  const withoutBattery = battery ? reduce(storageState, { type: 'demolish', plantId: battery.id }).state : storageState
  const contractState: GameState = {
    ...createInitialState(8001, 'kakheti'),
    act: 2,
    money: 500_000,
    plants: [{ id: 1, type: 'translink', region: 'kakheti', slot: null, turnsLeft: 0 }],
    nextPlantId: 2,
    contract: { customer: 'armenia', quartersLeft: 2, missed: 0 },
  }
  const protectedRoute = reduce(contractState, { type: 'demolish', plantId: 1 })

  const ok =
    full.rejected === 'rejNoSlot' &&
    !removed.rejected &&
    removed.state.money === beforeMoney - cost &&
    !removed.state.plants.some((p) => p.id === plant.id) &&
    Boolean(battery) &&
    withoutBattery.storedMWh === storageCapacity(withoutBattery) &&
    protectedRoute.rejected === 'rejContractAsset'
  target('8 V2 land + demolition', ok, ok ? 'full land rejects; paid removal frees site; storage clamps' : `V2 invariant failed; battery=${batteryBuild.rejected ?? 'built'}`)
}

console.log(`\n${failures === 0 ? 'SIM GREEN' : `SIM RED — ${failures} target(s) failing`} (${((performance.now() - t0) / 1000).toFixed(1)}s, seeds=${SEEDS})`)
process.exit(failures === 0 ? 0 : 1)
