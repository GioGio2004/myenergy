# DECISIONS.md — one-liners logged during the build (dev rules §10)

- 2026-07-11 M0 · App lives in `deni/` (this repo) — it already had docs 01–05 + template; "repo root" in 03 §6 = this folder. (User confirmed.)
- 2026-07-11 M0 · Game view code grouped under `src/game/{screens,hud,scene}` instead of `src/ui/` + `src/scene/` — user request ("Game directory like route"). Docs 03 §6 and 05 §1 updated; ownership/rules unchanged. (User confirmed.)
- 2026-07-11 M0 · package.json renamed `myenergy` → `deni`; wrong dep `@clerk/react` replaced with `@clerk/clerk-react` per 03 §1.
- 2026-07-11 M0 · SaveRepo frozen with 4 methods: `load`, `persist`, `listSnapshots`, `submitScore` (superset of 03 §2's three — snapshots needed for the 3-snapshot slot spec).
- 2026-07-11 M0 · `src/auth/` stub exports `AuthProvider` = guest passthrough when `VITE_CLERK_PUBLISHABLE_KEY` is absent; AUTH teammate replaces internals only.

## Roadmap (ideas parked tonight, per dev rules §9)
- (none yet)
