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

- 2026-07-12 M2 · Rejection numbers: UI appends have/need (`… · 62/75`) to the generic engine rejection keys — engine keys stay simple, dev-rules §4.4 example satisfied at the display layer.
- 2026-07-12 M2 · endTurn opens the resolution summary modal; act splashes queue behind it; game-over card renders after both.
- 2026-07-12 M3 · Diorama shipped as PROCEDURAL primitives (no GLB downloads at 3 AM — docs/03 §5 fallback made the default). One shared MeshToonMaterial palette; home region only (2nd region gets the world map, not a 2nd diorama).
- 2026-07-12 M3 · Cosmetic animation = bounded 1.8s rAF bursts after each sync (turbine spin), then the loop STOPS — satisfies both "prosperity is visible" and "no free-running loop".
- 2026-07-12 M5 · Judge mode `?act=2|3` fast-forwards balancedCoastAware bot @ seed 20260712, region kartli (expands to adjara for the cable). Deterministic; act reached by turn 16/18.
- 2026-07-12 M5 · Second-region picker is a modal off a floating banner (Act II, while regions<2); Build/Trust panels get region tabs.
- 2026-07-12 M6 · SFX are synthesized WebAudio tones (no audio assets, works offline); triggered by a store-diff subscription — engine untouched.
- 2026-07-12 M7 · Score submit = nickname form on the game-over card via frozen saveRepo.submitScore; leaderboard DISPLAY stays AUTH-track (Convex booth screen) per contract — not re-implemented locally.

- 2026-07-12 polish · Pre-demo pass: Cyrillic МВт→MW in fact cards; toast wraps at 360px (was nowrap-overflow on long KA rejections); win screen gets sunburst rays + grade pop + turns/CO₂ rows (existing string keys only). Judge mode rehearsed headless: act2 @ t16, act3 @ t18, replay identical. Sim + build green after every change.

## Roadmap (ideas parked tonight, per dev rules §9)
- Region-switchable diorama tab (2nd region currently shown via world map only)
- Local top-5 leaderboard on game-over (needs a read method — SaveRepo is frozen; AUTH adds it at merge)
