# DENI — Development Rules (binding for everyone, humans and Claude)
## v1.0 · EnergoHack 2026 overnight build

These rules exist so two tracks (GAME + AUTH) ship one bug-free product overnight. When a rule fights convenience, the rule wins. Exceptions are logged in `docs/DECISIONS.md` with one line of why.

## 1. Ownership map (do not edit outside your zone without a ping)

| Zone | Owner |
|---|---|
| `src/engine/`, `src/scene/`, `src/ui/`, `sim/` | GAME track |
| `src/auth/`, `convex/`, merge dialog, booth leaderboard screen | AUTH track |
| `src/services/saves.ts` (the `SaveRepo` interface) | FROZEN after M0 — changing it requires both owners agreeing, in person |
| `docs/` | anyone may append; nobody rewrites history mid-night |

## 2. Git workflow (hackathon trunk-based)

- `main` must ALWAYS run: `npm run dev` boots, `npm run build` passes, `npx tsx sim/sim.ts` green. Broken main at 3 AM = everyone blocked.
- Short-lived branches `game/<thing>`, `auth/<thing>` → merge to main yourself as soon as it runs; no PR reviews tonight, but **pull + run before every merge**.
- Commit small and often; message = what changed, one line. No force-push to main. Ever.
- **Demo freeze:** 60 min before the demo, main is frozen — only `docs/` and balance-number (data.ts) commits allowed after that.

## 3. Secrets & env

- `.env.local` only (gitignored). Keys: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`. These are publishable/public-by-design keys — but still never hardcode them in source.
- The app MUST boot with NO env vars at all → guest-only mode. This is CI for the teammate contract: if your change breaks keyless boot, revert it.

## 4. The 5 iron rules of code (full text in 03-ARCHITECTURE.md §7)

1. `src/engine/` is pure TS: no DOM, no three.js, no `Date.now()`, no `Math.random()`, no storage. Randomness = seeded rng carried in state.
2. One-way data flow: UI dispatches actions → engine returns new state → store updates → React/scene render. No `setTimeout`/`setInterval`/`useEffect` ever mutates game state.
3. All numbers live in `src/engine/data.ts`, all user-facing text in `src/engine/strings.ts` as `{ka, en}` (Georgian default). A hardcoded string or number in a component is a bug.
4. Locked/unaffordable actions render disabled WITH the reason ("სჭირდება ნდობა 75 — გაქვს 62"). The engine validates every action anyway and returns a rejection, never throws.
5. Clamp at source: money = integer GEL, trust/dependence = 0–100, every resource `assertFinite` in dev.

## 5. Testing gates (non-negotiable)

- After ANY change to `engine/` or `data.ts`: run `npx tsx sim/sim.ts`. Red sim = fix before anything else. Balance failures are fixed in `data.ts`, never by special-casing the engine.
- After ANY UI change: check 360×640 portrait in devtools before committing.
- Before sleep and before demo: the full manual checklist (03-ARCHITECTURE.md §8).

## 6. 3D discipline (GAME track)

Render-on-demand only (no free-running 60fps loop) · `setPixelRatio(min(dpr, 2))`, 1.5 mobile · no shadow maps on mobile (`?fx=high` for the laptop) · <100k tris, <50 draw calls · handle `webglcontextlost/restored` by rebuilding from state · placement via tappable slots, never mesh-dragging · if the diorama slips its 2h cap → execute Plan B (SVG panorama behind the same `syncScene(state)` interface) without debate.

## 7. Auth & saves discipline (AUTH track)

Guest mode is sacred: no sign-in gate before play, no modal on first launch. Autosave every turn to IndexedDB via `SaveRepo`; cloud sync is additive. Sign-in prompts appear only at designed moments (post-Act-I win, end screen). Save merge: newest timestamp wins; prompt the user only on a true conflict. Cloud writes queue offline (Dexie outbox) and flush on reconnect. Leaderboard entries: nickname for guests, profile for signed-in.

## 8. Language & copy

Georgian is the default and must be flawless — English via toggle. All copy through `t(key)`; no literals in components. Tone: warm, witty, specific (see 01-GAME-DESIGN.md). Every consequence explained in one sentence — the player always knows WHY a number changed.

## 9. Scope law

The cut order (leaderboard → samegrelo → offshore → 2nd export customer → cloud saves) is pre-agreed — no debates at 4 AM. NEVER cut: Namakhvani interstitial, blackout-darkens-the-diorama, judge mode (`?act=3`), Georgian language, guest instant start. New feature ideas tonight go to `docs/DECISIONS.md` under "roadmap", not into code.

## 10. Working with Claude

Claude builds milestone by milestone (M0→M7, 03-ARCHITECTURE.md §9); each milestone ends as a WORKING game. Ambiguity → simplest option consistent with `docs/`, logged in `docs/DECISIONS.md`, keep moving. Humans review the milestone status lines and play-test on a phone while the next milestone runs.
