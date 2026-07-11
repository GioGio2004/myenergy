# Copy-paste this entire block into a fresh Claude Code session (opened at the repo root) to build the game (v2.2)

---

You are my lead game engineer at EnergoHack 2026 (Georgia, demo tomorrow morning). We are building **DENI — Energy Stewards of Georgia**: a turn-based, mobile-first 3D strategy game (installable PWA) where an entrepreneur with ₾10,000 lights up a Georgian region, learns the Namakhvani lesson (trust before megaprojects), escapes imported-gas dependence, expands across regions, and wins by exporting green energy to the EU through the real Black Sea submarine cable.

The complete plan exists in this repo. Before writing ANY code, read these files fully — they are the spec and are non-negotiable:

1. `docs/01-GAME-DESIGN.md` — three-act arc, turn dilemma (deficit → gas vs blackout; surplus → store vs export), regions, trust/Namakhvani gate, export contracts
2. `docs/02-BALANCE-DATA.md` — every number (becomes `src/engine/data.ts` verbatim), sim-bot acceptance targets
3. `docs/03-ARCHITECTURE.md` — stack, repo layout, persistence/auth architecture, 3D rules, asset pipeline, milestones M0–M7, Plan B
4. `docs/05-DEVELOPMENT-RULES.md` — binding rules: ownership zones, git workflow, testing gates, scope law

Build the app at the REPO ROOT exactly per the architecture doc's layout.

Hard rules (full versions in the docs):
- Stack (FINAL): Vite + React 19 + TypeScript + Three.js (imperative, NOT react-three-fiber) + zustand + vite-plugin-pwa + Dexie/IndexedDB + Clerk (@clerk/clerk-react) + Convex. NO Next.js, NO game engine, NO CDN at runtime. `vite build` output must run offline as static files and install as a PWA.
- Local-first persistence: guest mode is the default — instant play, no sign-in gate, autosave EVERY turn to IndexedDB via the `SaveRepo` interface in `src/services/saves.ts` (define it in M0 and FREEZE it — a teammate builds Clerk auth/onboarding + Convex cloud saves against it in parallel and owns `src/auth/` + `convex/`; leave those as stubs). The app must build and run with all env keys absent.
- React renders screens/HUD only; Three.js renders the diorama ONLY; ALL UI is DOM/CSS overlay, mobile-first (portrait: diorama top, thumb action bar bottom; test at 360×640 from M2 on). Placement via tappable slots, never mesh-dragging. One idempotent `syncScene(state)`; cosmetic animations never write state.
- Mobile 3D discipline: render-on-demand (turn-based — never a constant 60fps loop), pixelRatio capped at 2 (1.5 mobile), no shadow maps on mobile (`?fx=high` for laptop), <100k tris, <50 draw calls, webglcontextlost/restored handler that rebuilds the scene from state.
- `src/engine/` is pure: no DOM, no three, no Date/Math.random/localStorage; seeded RNG in state; replayable via `?seed=&region=&act=` (act-jump = judge demo mode). React components dispatch actions and read the zustand store — never compute game logic.
- All numbers in `data.ts`, all text in `strings.ts` `{ka, en}`, Georgian default.
- 3D assets: load CC0 GLBs from `public/assets/models/` (shopping list in architecture doc §5 — poly.pizza / Kenney / Quaternius; download them first if missing, using curl or the Chrome tools). Strip textures, apply one shared warm toon material. Procedural low-poly terrain per region. Missing model → stylized primitive stand-in — never block on assets.
- Milestones M0→M7 strictly in order; each ends as a WORKING game. After M1, `npx tsx sim/sim.ts` must pass the bot suite in docs 02 §7 — rerun after every engine/balance change. M3 (diorama) has a 2-hour hard cap → then execute Plan B (SVG panorama behind the same syncScene interface) and keep moving.
- Cut order if behind schedule: leaderboard → samegrelo region → offshore wind → 2nd export customer → cloud saves (guest-only demo is still fine). NEVER cut: Namakhvani interstitial, blackout-darkens-the-diorama mechanic, judge mode, Georgian language, guest instant start.

Working style:
- Work autonomously milestone by milestone; after each, 2-line status + how to test, then continue. Ambiguity → simplest option consistent with the docs, logged in `docs/DECISIONS.md`, keep moving. Keep `main` always runnable (dev rules §2).
- Beauty bar (M6): warm Georgian palette, day/night tied to seasons, village windows lighting up with prosperity, blackout turning the diorama dark, witty Georgian news headlines, WebAudio blips. The jury's first 10 seconds decide everything.
- The Namakhvani interstitial and the first blackout are the two sacred demo moments — polish them.

When done: run the manual checklist (docs 03 §8) including phone + PWA install + airplane mode, run the sim one final time, then give me (a) the rehearsed stage seed + `?act=3` judge-mode link + a 90-second demo script, and (b) deploy steps (Netlify) + QR code instructions.

Start now with M0.

---
