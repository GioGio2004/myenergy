# DECISIONS.md — one-liners logged during the build (dev rules §10)

- 2026-07-11 M0 · App lives in `deni/` (this repo) — it already had docs 01–05 + template; "repo root" in 03 §6 = this folder. (User confirmed.)
- 2026-07-11 M0 · Game view code grouped under `src/game/{screens,hud,scene}` instead of `src/ui/` + `src/scene/` — user request ("Game directory like route"). Docs 03 §6 and 05 §1 updated; ownership/rules unchanged. (User confirmed.)
- 2026-07-11 M0 · package.json renamed `myenergy` → `deni`; wrong dep `@clerk/react` replaced with `@clerk/clerk-react` per 03 §1.
- 2026-07-11 M0 · SaveRepo frozen with 4 methods: `load`, `persist`, `listSnapshots`, `submitScore` (superset of 03 §2's three — snapshots needed for the 3-snapshot slot spec).
- 2026-07-11 M0 · `src/auth/` stub exports `AuthProvider` = guest passthrough when `VITE_CLERK_PUBLISHABLE_KEY` is absent; AUTH teammate replaces internals only.

- 2026-07-11 M1 · Economy model (docs left it unspecified): you SELL served energy at BASE_PRICE×season (PPA plants at their flat price); gas margin 300−220 makes the peaker genuinely seductive; co-investment = pay cost×share, earn share of revenue, pay share of upkeep.
- 2026-07-11 M1 · National-grid fallback: non-winter gaps are auto-covered by the (imported-gas) grid — feeds Dependence, no blackout; WINTER fallback covers only 55% of demand (real Georgian winter deficit) → first winter blackout is scripted-by-physics (a demo moment). Contracts are served BEFORE home demand — that's the over-export lesson.
- 2026-07-11 M1 · Dependence = smoothed gas share (converges 25%/quarter toward actual share) — the ±6/−3 step model in docs/02 §1 mathematically couldn't reach the <40 cable gate in 36 turns.
- 2026-07-11 M1 · solarfarm + battery moved to Act I behind their trust/track gates (docs/01 §6 v1 ladder lists farms+battery in the ladder; sun/hydro regions cannot reach 100% coverage otherwise — sim target 1 was 0%).
- 2026-07-11 M1 · rooftop & gaspeaker don't occupy siting slots (they live in the village); slots per region: 3 fields + 3 ridges + 3 rivers (+1 coast), stars derived from region stats.
- 2026-07-11 M1 · HPP_RUSH_PROTEST_CHANCE 0.60→0.65 (sim needs ≥55% observed; 0.60 was flaky), GASSPIKE_FUEL_MULT 1.5→1.8, GIG_PAYOUT 3500→4500, DEMAND_GROWTH 4%→3%(+1%/prosperity). All tuned via sim per docs/02 §7 "fail → tune this file".
- 2026-07-11 M1 · Act I win counts your peaker toward coverage (dependence + spike events still punish it); Act II self-cover uses own-region generation only; translink transfers lose 8%.

## Roadmap (ideas parked tonight, per dev rules §9)
- (none yet)
