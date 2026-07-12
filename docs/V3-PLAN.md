# DENI 3.0 — Plan & CTO Decision

## The frame that wins this hackathon

EnergoHack judges on **commercialization + finished prototype**. We win by shipping
**two artifacts**, not one giant feature list:

- **(A) The prototype** — bug-free, accurate map, beautifully lit, offline-solid. Wins "finished prototype."
- **(B) The roadmap** — where AI advisor, multiplayer/social, and region expansion live as *funded growth phases*. Wins "commercialization."

Most of the user's V3 ideas are **great slide material** but **wrong build material** for hackathon time. The discipline of separating the two is itself a winning signal to a jury.

---

## CTO decisions (agree / redirect)

| Idea | Decision | Why |
|---|---|---|
| Accurate full Georgia map incl. Abkhazia | **DONE — build** | Political necessity, not cosmetics. A jury reads an incomplete map as denying territorial integrity. Already fixed & verified. |
| Modern graphics, "not 2006" | **Build — but stylized, not photoreal** | 80% of the "premium" gap is *lighting & post-processing*, not polygons. Target ISLANDERS / Townscaper / Monument Valley, not AAA. Achievable; photoreal is a time trap. |
| Replace emoji with icons | **Build (in progress)** | Cheap, high perceived-quality win. Inline SVG set started (`src/game/ui/Icon.tsx`); finish the app-wide sweep. |
| Google/Flash AI **in the game (live)** | **Redirect → build-time pipeline; live = roadmap** | Our #1 reliability asset is offline-PWA. A live LLM call throws that away and risks an on-stage failure. Use AI to *generate* content ahead of time, ship it static. |
| Friends / stalk / gifts / share resources | **Roadmap only** | Needs backend, social graph, real-time sync, anti-abuse. Half-built = broken on stage, and it dilutes our unique civic/education core. Excellent *commercialization* story though. |

---

## Pillar 1 — Graphics that read as premium (the "not 2006" fix)

The current low-poly diorama is fine geometry with flat, dated rendering. Fix the *rendering*, keep the geometry. Concrete, all achievable in three.js with no new asset pipeline:

1. **Tone mapping + exposure** — `renderer.toneMapping = ACESFilmicToneMapping`, `outputColorSpace = SRGB`. Instantly modern color response.
2. **Soft contact shadows** — a single blurred shadow plane or PCFSoft shadow map (desktop only; mobile keeps the cheap path). Objects stop "floating."
3. **Subtle bloom** on windows, sun, turbine tips (small UnrealBloomPass, desktop-gated) — the "glow" that reads as 2020s.
4. **Cohesive graded palette** — one warm key light + cool sky fill, per-season grade. (Terrain palette per region already landed in the bug pass.)
5. **Ground the diorama** — vignette, soft gradient sky dome instead of a flat color, gentle fog for depth.
6. **Motion easing** — camera and number transitions on easing curves; a 4–6s animated quarter-resolution (already the top item in V2-PLAN's polish sprint).
7. **Ambient occlusion (cheap)** — bake a soft darkening into vertex colors at crevices; no SSAO needed.

Ship-gate: keep the mobile/`fxHigh=false` path cheap. All heavy effects are desktop-only, feature-detected.

## Pillar 2 — AI as a build-time content studio (innovation without demo risk)

Use the generation tooling we have (image/audio/3D/text) to *pre-produce* assets, then ship them static so the game stays offline:

- **Narrated Georgian tutorial + citizen voice lines** (generate audio once → bundle).
- **Region hero art / loading illustrations** and **texture maps** for the low-poly world.
- **Contextual "energy fact" copy** authored/vetted ahead of time (we already have 16 fact cards — expand the library with AI drafts, human-checked).
- **A friendly mascot advisor** ("Deni") — pre-rendered expressions, scripted branch lines, *not* a live model.

Pitch line: "Our content is AI-produced; our runtime is deterministic and offline — reliable in a classroom with no wifi." That is a *stronger* story than a live chatbot.

**Roadmap (slide, not build):** a live Flash-powered advisor that answers a kid's "why did my city go dark?" in natural Georgian — gated behind connectivity, with the offline scripted advisor as fallback.

## Pillar 3 — Finish the icon sweep

`src/game/ui/Icon.tsx` exists with a coherent inline-SVG set. Replace remaining emoji in: HUD vitals, BuildPanel, MarketPanel, ActionBar, event chips, toasts, act splashes. One consistent stroke weight and the "cheap" look is gone.

## Pillar 4 — Social / multiplayer (ROADMAP — commercialization, not build)

Frame for the pitch, don't build now:
- **Phase 1 (retention):** async "ghost cities" — see friends' Georgia grids, send an energy "gift" (a free build), weekly regional leaderboard. Async = no real-time backend.
- **Phase 2 (collaboration):** co-op national grid — friends each run a region, trade power across a shared Georgia.
- **Business model:** free for schools (B2G/B2B2C via Ministry of Education + partners), cosmetic/region packs, sponsored real-utility scenarios. This is the commercialization spine.

We already have Clerk + Convex scaffolded, which makes this *credible* on a slide ("the backend seam is already in place") without spending build time now.

---

## The winner sprint (priority order)

1. **[DONE]** Fix the 6 reported bugs (map, terrains, placement, water, trust UI, zoom-out map).
2. **Redeploy** — the live site is still pre-fix; push the current build.
3. **Graphics grade** — tone mapping + soft shadows + bloom + sky dome (Pillar 1, items 1–5). Biggest wow-per-hour.
4. **Animated quarter-resolution** (4–6s energy-flow rail) — the single most requested V2 polish item.
5. **Finish icon sweep** (Pillar 3).
6. **Screenshot QA** at 390×844, 1024×768, 1366×768, 1440×900 (needs Chrome extension / device).
7. **5 unaided child playtests** — the real acceptance gate.
8. **Pitch deck** — two-artifact story: finished prototype + AI/social/schools roadmap.

## Acceptance bar (unchanged where it still holds)
- New player places a valid first building < 60s, no spoken help.
- Every region looks distinct at a glance.
- Map shows complete Georgian territory incl. Abkhazia. ✓
- Every legal action gives feedback < 200ms.
- Runs fully offline. (Do not regress this.)
- 4/5 hallway testers finish the first mission unaided.
- build + lint + sim + replay green before every demo build.

## Explicitly NOT doing (and why)
- **Live in-game LLM calls** — breaks offline reliability, adds stage-failure risk. → build-time pipeline instead.
- **Real social backend** — scope + anti-abuse; half-built reads as broken. → roadmap.
- **Photoreal 3D** — time trap; stylized-polished beats photoreal-janky. → art direction.
