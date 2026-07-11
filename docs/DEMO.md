# DENI — demo runbook (July 12)

## Run it
```bash
npm install        # once
npm run dev        # http://localhost:5173
npm run build && npm run preview   # production check (PWA served at :4173)
npx tsx sim/sim.ts # balance gate — must be GREEN (500 seeds: SIM_SEEDS=500)
```

## Judge URLs (rehearsed, deterministic)
| URL | What the judges see |
|---|---|
| `/` | guest instant start — title → region → play |
| `/?act=2` | prepared midgame: Act II splash, Kartli powered, expansion pending |
| `/?act=3` | prepared midgame: Act III splash, Kartli+Adjara, cable within reach |
| `/?seed=42&region=imereti` | deterministic fresh run (Namakhvani region) |
| add `&fx=high` | laptop: shadows on |
| add `&big=1` | booth screen: 1.3× zoom |

Judge seed: **20260712**, region **kartli** (bot expands to adjara for the cable landing).

## 3-minute demo script
1. Phone, airplane mode, installed PWA → instant guest start (offline-first).
2. Kakheti: gigs → rooftop → trust to 50 → community solar on the ⭐⭐⭐ field ("the slot TELLS you why").
3. End turn → resolution summary + real fact card. Show the gas peaker as "the seductive wrong answer" (Dependence meter climbs).
4. First winter → national grid covers only 55% → **the diorama goes dark** (blackout = the lesson).
5. Laptop `?act=3`: world map, EU contract, Namakhvani interstitial both paths (rush → protest burns 30%).
6. Win screen: grade + score + nickname submit. Pitch the data-driven engine (country packs = data files).

## Pre-demo checklist (docs/03 §8)
- [ ] `npx tsx sim/sim.ts` green · `npm run build` clean
- [ ] iPhone Safari + Android Chrome, 360×640 portrait
- [ ] Airplane-mode full game + relaunch (resume from IndexedDB)
- [ ] PWA install from QR (deploy → any static host: `dist/` is self-contained, no env keys needed)
- [ ] Both Namakhvani paths · export contract success & failure
- [ ] `?act=3` loads in <2s · `?fx=high` on the laptop
- [ ] zip of `dist/` on USB + phone as last resort

## Deploy
`dist/` is a static PWA — drag onto Netlify/Vercel/GitHub Pages. **No env vars required** (guest-only mode is the demo mode). Clerk/Convex keys are optional AUTH-track upgrades.

## Demo freeze
60 min before demo: only `docs/` and `data.ts` commits (dev rules §2).
