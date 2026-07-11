# DENI — Architecture, Stack & Asset Pipeline v2.2
## (v2.2: repo layout — app lives at REPO ROOT, docs in `docs/`. Content otherwise = v2.1: Clerk auth, Convex cloud saves, Dexie offline-first, 3D verdict, teammate contract)

Goal unchanged: **zero bugs at demo.**

## 1. Stack decision — final

**Vite + React 19 + TypeScript + Three.js + vite-plugin-pwa + Clerk (@clerk/clerk-react) + Convex + Dexie (IndexedDB) + zustand.**

### Why not Next.js (decided WITH auth/db requirements considered)
- Clerk ships a **first-party SPA SDK** (`@clerk/clerk-react`) — officially documented for Vite; Next.js is NOT required for Clerk. Clerk's own guidance: SPA is right when the app is fully client-rendered; Next.js is for SSR/server-secrets/middleware — a game has none. Our only keys (Clerk publishable key, Convex URL) are public by design.
- "No future headaches" points AWAY from Next: with **Convex** (managed backend, official Clerk integration) there is **no server of ours to maintain** — no API routes, no DB migrations, no cold starts. Next API routes would mean we own a server.
- PWA/offline is a hard requirement → static SPA is the natural shape; `vite-plugin-pwa` (Workbox) is the most mature path.
- Gameplay: SPA = no hydration, no RSC complexity, smaller bundle, full ownership of the render loop.
- SEO marketing site later = separate tiny site; never couple the game to it.

### Why React
Auth + onboarding use Clerk's prebuilt React components (`<SignIn/>`, `<UserButton/>`). One React app = one codebase, shared theme, parallel teamwork. React renders **screens/HUD only** — the simulation stays pure TS, the diorama stays imperative Three.js. State bridge: **zustand**.

## 2. Persistence & auth architecture (local-first)

**Principle: the game NEVER waits for the network. Auth is an enhancement, not a gate.**

```
gameState (pure engine, seeded)
   │ after EVERY endTurn
   ▼
SaveRepo interface  ──►  LocalSaveRepo: Dexie/IndexedDB (always, instantly)
                    ──►  CloudSaveRepo: Convex (only when signed in; queued offline)
```

- **Guest mode = default.** "თამაში" starts instantly, zero screens. Autosave every turn to IndexedDB (Dexie): slot `current` + 3 snapshots (state + seed + action log — the deterministic engine makes saves tiny and replayable). Close mid-turn, reopen offline → continue exactly there.
- **Sign-in (Clerk) = upgrade.** On sign-in, local save uploads and merges (newest-timestamp wins; prompt only on true conflict). Progress syncs across devices. Sign-in is offered at emotional peaks (after Act I win: "შეინახე პროგრესი ღრუბელში"), never demanded.
- **Offline queue:** cloud writes go through a Dexie-backed outbox, flushed on `online`/visibilitychange.
- **Leaderboard:** Convex table (name/score/region/grade), realtime subscription — booth screen updates live. Guests submit with a nickname; signed-in users get profile + persistence.
- localStorage holds only tiny prefs (lang, mute, fx). Saves live in IndexedDB only.

### Teammate parallel-work contract
- **Auth teammate owns:** `src/auth/` (ClerkProvider, sign-in/up, onboarding), `convex/` schema+functions, save-merge UI, booth leaderboard screen.
- **Game side owns:** `src/engine/`, `src/scene/`, `src/ui/`.
- **The ONLY shared surface:** `src/services/saves.ts` — `interface SaveRepo { load(), persist(state), submitScore(entry) }` + Clerk's `useSession()`. Interface is defined at M0 and FROZEN; both sides mock against it. The app must build and run with `VITE_CLERK_PUBLISHABLE_KEY` absent (guest-only mode).

## 3. 3D vs 2D — verdict: **ship the 3D diorama** (risk researched and contained)

Documented killers of 3D browser games on phones: rendering at devicePixelRatio 3 (9× fill cost), shadow maps (extra full-scene pass), >100 draw calls, thermal throttling (60fps scenes drop to ~20fps after ~30s sustained), iOS Safari WebGL context loss, uncompressed textures.

Why OUR design dodges each:
- **Turn-based = render-on-demand.** No constant 60fps loop: render on state change / active cosmetic animation; pause on `visibilitychange`. The thermal problem mostly evaporates — our biggest structural advantage.
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`, 1.5 on mobile.
- **No shadow maps on mobile** (baked AO gradient + blob shadows; `?fx=high` enables shadows on the demo laptop).
- Untextured toon low-poly = zero texture memory pressure; <100k tris, <50 draw calls (merged static terrain).
- **Context-loss handler**: `webglcontextlost/restored` → rebuild scene from state (trivial — the scene is always derived from `gameState`).
- **Plan B pre-decided:** `syncScene(state)` is renderer-agnostic; if the diorama isn't solid within its 2h milestone cap, swap to the SVG panorama. Gameplay is DOM-driven either way — 3D is a view, never the input surface.

## 4. 3D scene rules

Fixed orbit camera (pinch-zoom, limited rotate). Placement via tappable DOM/slot markers — never mesh-dragging. One idempotent `syncScene(state)`. Cosmetic animations never write state.

## 5. Asset pipeline

CC0 GLBs from [poly.pizza](https://poly.pizza/search/Renewable%20Energy), [Kenney](https://kenney.nl), [Quaternius](https://quaternius.com) → strip textures → one shared warm `MeshToonMaterial` palette → visual unity. **Shopping list:** wind turbine, solar panel array, dam/HPP, industrial building (gas peaker), battery/container, houses ×3, factory, trees ×3, power pylon, ship. Procedural low-poly terrain per region (7 regions from one generator + data). AI 2D art via Higgsfield: title, region cards, Namakhvani interstitial, PWA icons — one consistent style prompt. Missing model → stylized primitive stand-in; never block on assets.

## 6. Repo layout (app at ROOT — this folder is the repo)

```
/  (repo root — initialized by team lead)
  README.md  .gitignore  index.html  vite.config.ts  package.json
  docs/              # THESE documents + DECISIONS.md (created during build)
  public/assets/models/*.glb   public/assets/art/*.webp
  convex/            # AUTH TEAMMATE: schema.ts saves.ts leaderboard.ts
  src/
    engine/          # PURE TS: data.ts strings.ts engine.ts rng.ts — no DOM/three/Date/random
    services/saves.ts  # SaveRepo interface + LocalSaveRepo(Dexie) + CloudSaveRepo(Convex)
    auth/            # AUTH TEAMMATE: ClerkProvider, onboarding, merge dialog
    store.ts         # zustand bridge: gameState + uiState
    game/            # ALL game-facing view code, mounted by the screen router
      screens/       # React screens: Title, RegionSelect, Main, TurnResolution, Win…
      hud/           # HUD, thumb action bar, panels, cards (DOM only)
      scene/         # diorama.ts assets.ts effects.ts (imperative three; plan-B swappable)
    audio.ts main.tsx
  sim/sim.ts         # headless: npx tsx sim/sim.ts
```

> v2.3 change (see docs/DECISIONS.md): former `src/ui/` + `src/scene/` are grouped under `src/game/` (screens/hud/scene). Ownership and all rules are unchanged — `src/game/` is GAME-track territory exactly as `src/ui/` + `src/scene/` were.

## 7. The 5 iron rules

1. **Engine purity** — seeded rng in state; replayable via `?seed=&region=&act=`.
2. **One-way data flow** — no timer/effect ever mutates game state; React components dispatch actions and read the store, never compute game logic.
3. **Data-driven everything** — new region/building/event = a data row, zero engine edits.
4. **Impossible states unrepresentable** — locked actions render disabled with the reason shown; engine validates anyway.
5. **Clamp at source** — money integer, trust/dependence 0–100, assertFinite in dev.

## 8. Testing

- `sim/sim.ts` bot suite + fuzzer per `02-BALANCE-DATA.md` §7 — run after EVERY engine/balance change.
- Seeded runs: `?seed=&region=&act=` (act-jump = judge mode, loads prepared midgame).
- Manual checklist before sleep AND before demo: guest→sign-in save merge · airplane-mode full game + relaunch · offline queue flush on reconnect · context-loss simulation (`WEBGL_lose_context`) · iPhone Safari + Android Chrome · PWA install · 360×640 portrait · both Namakhvani paths · export contract success & failure · leaderboard live update on 2nd device.

## 9. Milestones (overnight, ~12h; AUTH track runs in parallel)

| M | h | Deliverable | Done when |
|---|---|---|---|
| M0 | 0.75 | Vite+React+TS+PWA scaffold, zustand, screen router, **SaveRepo interface + Dexie autosave stub**, HUD shell | installable blank app; interface frozen |
| M1 | 2 | Engine v2 + sim green | `npx tsx sim/sim.ts` passes |
| M2 | 1.5 | Full loop in DOM UI, mobile layout, autosave/resume (guest) | playable on phone, survives refresh offline |
| M3 | 2 | Diorama: terrain, GLB+toon restyle, slots, syncScene, render-on-demand, DPR cap, context-loss handler | Act I beautiful; **2h hard cap → Plan B** |
| M4 | 1.5 | Events, Namakhvani interstitial, fact cards, act splashes | both paths work |
| M5 | 1.5 | Act II + Act III (world map, contract) | full arc winnable |
| M6 | 1.5 | Beauty: day/night, blackout darkness, headlines, sound, ka strings | the "wow" |
| M7 | 1 | Balance via sim, device QA, CloudSaveRepo + leaderboard integration, deploy, QR, judge seed | demo-proof |
| AUTH (parallel) | — | Clerk onboarding, Convex schema/functions, merge dialog, booth screen | integrates at M7 against the M0 interface |

**Cut order if behind:** leaderboard → samegrelo → offshore wind → 2nd export customer → cloud saves (guest-only demo is still complete). **NEVER cut:** Namakhvani interstitial, blackout-darkens-the-diorama, judge mode, Georgian language, guest instant start.

## 10. Demo hardening

Rehearsed seed + `?act=3` judge jump · `?fx=high` laptop / defaults on phones · QR → installed PWA · airplane-mode verified · zip on USB + phone · `?big=1` font bump · realtime leaderboard on booth screen.
