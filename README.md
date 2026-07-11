# DENI — Energy Stewards of Georgia · დენი

EnergoHack 2026. Turn-based, mobile-first 3D strategy game (installable PWA): start with ₾10,000, light up a Georgian region, learn the Namakhvani lesson (community trust before megaprojects), escape imported-gas dependence, and win by exporting green energy to the EU through the real Black Sea submarine cable.

**Stack:** Vite · React 19 · TypeScript · Three.js · zustand · vite-plugin-pwa · Dexie (IndexedDB, offline-first saves) · Clerk (auth) · Convex (cloud saves + realtime leaderboard).

## Read first (in order)

| Doc | What |
|---|---|
| [docs/GEGMA-QARTULAD.md](docs/GEGMA-QARTULAD.md) | გეგმის შეჯამება ქართულად |
| [docs/01-GAME-DESIGN.md](docs/01-GAME-DESIGN.md) | Game design: three acts, turn dilemma, regions, trust/Namakhvani, export |
| [docs/02-BALANCE-DATA.md](docs/02-BALANCE-DATA.md) | Every number + sim acceptance targets |
| [docs/03-ARCHITECTURE.md](docs/03-ARCHITECTURE.md) | Stack, repo layout, persistence/auth, 3D rules, milestones M0–M7 |
| [docs/04-BUILD-PROMPT.md](docs/04-BUILD-PROMPT.md) | Copy-paste prompt that starts the Claude build session |
| [docs/05-DEVELOPMENT-RULES.md](docs/05-DEVELOPMENT-RULES.md) | **Binding** dev rules: ownership zones, git workflow, testing gates, scope law |

`docs/DECISIONS.md` is created during the build — judgment calls land there.

## Team split

- **GAME track** (+ Claude): `src/engine/`, `src/scene/`, `src/ui/`, `sim/` — milestones M0–M7.
- **AUTH track**: `src/auth/`, `convex/` — Clerk onboarding, cloud saves, merge dialog, booth leaderboard. Built against the `SaveRepo` interface (`src/services/saves.ts`), frozen at M0.
- Guest mode is sacred: the game always starts instantly and runs fully offline; auth only adds cloud sync.

## Quick start (after M0 exists)

```bash
npm install
npm run dev          # boots WITHOUT any env keys = guest-only mode
npx tsx sim/sim.ts   # headless balance/fuzz suite — must be green before merging engine changes
```

Env (optional, `.env.local`, gitignored): `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`.
