# DENI — Energy Stewards of Georgia (დენი)
## Game Design Document v2.0 — replanned July 11 after teammate spec merge

> v2 supersedes v1. Merges teammate's "Georgia Energy Stewards" spec (multi-region + export) with the v1 Namakhvani-trust core, adds gas/import dependence, blackout/reliability mechanics, and a 3D diorama presentation. Cut list at the bottom.

---

## 1. Category & positioning

**Category:** turn-based resource-management strategy (city-builder/tycoon hybrid) · serious game / edutainment · browser + installable PWA, mobile-first.
**Comparables:** Terra Nil (tone/beauty), Islanders (minimal 3D diorama), Frostpunk (moral pressure), Power Network Tycoon (the generic competitor we beat by being *about a real country*).
**One-liner:** *"₾10,000, one Georgian region, and a country that imports every cubic meter of its gas. Build trust, master your rivers and winds, keep the lights on through winter — and one day power Europe through the Black Sea cable."*

## 2. The three-act arc (this is the anti-boring structure)

| Act | Goal | New mechanics | Teaches |
|---|---|---|---|
| **I. Light your region** | Meet your region's demand reliably for 3 consecutive quarters | build, seasons, trust, gas crutch, blackouts | how generation actually works; Namakhvani lesson |
| **II. Power Georgia** | Expand to a 2nd region; national grid; storage | transmission link, 2nd-region suitability contrast, batteries/pumped hydro | intermittency, why storage & mix matter |
| **III. Europe's green battery** | Build the Black Sea cable share + fulfil a 4-quarter EU export contract | export contracts, reliability guarantees, world-map energy flow | the REAL 2026 Georgia–Romania cable, HVDC, energy geopolitics |

Full run 12–18 min. **Judge mode:** `?act=3` demo seed jumps to a prepared mid-game — per teammate's "skip to mid-game" idea. Win screen: Georgia glowing on a map feeding an arc of light to Romania — *"საქართველო ევროპის მწვანე ბატარეაა"*.

## 3. The turn dilemma (why gameplay isn't "basic stupid")

Every quarter the player faces a real three-way squeeze, same one Georgia faces:

```
DEMAND (grows with prosperity, spikes in winter)
   vs
YOUR GENERATION (hydro/solar/wind × region × season × weather events)
        │
   deficit?  →  ① burn IMPORTED GAS  (−₾, +CO₂, +Dependence meter)
                ② let a BLACKOUT happen (−Trust, −Prosperity, dark diorama)
   surplus?  →  ③ STORE it (battery / pumped hydro)
                ④ SELL / EXPORT it (₾, reputation — but over-commit and winter bites you)
```

Dependence meter (0–100) is the national-awareness metric: high dependence = price-spike events hit harder; low dependence unlocks the cable act. This is the "not only electricity" layer: **gas is in the game as what Georgia actually uses it for — the imported crutch.**

## 4. Resources on the HUD (5 + act tracker)

₾ Money · ⚡ Supply vs Demand (dial, the star of the HUD) · 🤝 Trust (per region) · 🔥 Dependence (imported gas share) · 🌱 CO₂ avoided · Act progress pips.

## 5. Regions (start with one; unlock a 2nd in Act II)

Same six as v1 (Kakheti sun / Kartli & Javakheti wind / Imereti & Racha hydro-with-Namakhvani-scar / Adjara coast) with two v2 additions:
- **Samegrelo** (7th region, teammate's example): persistently cloudy, river-rich, coastal — the "solar trap" region that punishes copy-paste strategies.
- **Coastal regions (Adjara, Samegrelo)** get late-game **offshore wind (Black Sea)** slot + they host the **cable landing station** in Act III.

**Micro-siting, simplified honestly:** each region diorama has typed slots — 🌊 river, ⛰️ ridge, 🌾 field, 🏖️ coast — with 1–3 star quality. Solar on a north slope isn't a hidden penalty to discover by suffering; the slot shows why ("ჩრდილოეთის ფერდობი — 60% output"). Wrong-type placement is impossible; *suboptimal* placement is visible and explained. Depth without frustration.

## 6. Buildables (v1 ladder + v2 additions)

v1 ladder unchanged (rooftop → gigs → community solar → turbine → farms → **HPP behind the Namakhvani trust gate** → battery). Added:
| Project | Act | Notes |
|---|---|---|
| Gas peaker plant | I | cheap, always-on — but burns imported fuel every quarter it runs and feeds Dependence. The seductive wrong answer. Some players NEED it in winter — that's the lesson |
| Pumped-hydro storage | II | Georgia's terrain superpower; stores surplus spring melt for winter |
| Transmission line (region link) | II | connects regions; % losses shown live |
| Offshore wind (Black Sea) | III | coast slots only, expensive, huge winter output |
| Black Sea cable share | III | co-invest with EU (real: PMI status, ~$2.3B, FID 2026); unlocks export contracts |

## 7. Trust & Namakhvani (unchanged from v1 — sacred)

Trust actions, decay, the scripted Namakhvani interstitial with the rush-vs-do-it-right choice, protest event that freezes construction and burns 30% of invested capital. Imereti/Racha keep the +10 hydro-trust scar. **This stays the demo centerpiece.** v2 addition: Trust now also feeds the **Awareness multiplier** (teammate's idea): region trust ≥80 gives +10% efficiency ("community maintains what it owns") and −20% project build time.

## 8. Export system (Act III — teammate's spec, cut to its essence)

- Choose customer: **Turkey** (existing lines, volatile spot prices), **Armenia** (small, steady), **EU via Black Sea cable** (the prize: premium price, brutal reliability clause).
- One contract card: volume/quarter × 4 quarters × reliability %. Deliver → ₾₾ + Prestige. Short-fall → penalty + reputation hit. Over-commit → your own diorama goes dark (the teachable failure).
- World-map screen with animated energy arc Georgia→customer. Losses shown per km (HVDC vs AC fact card here).

## 9. Events (v1 table + v2 additions)

Added: cold snap in Turkey (spot price ×2 — sell now?), Enguri low reservoir (real 2025 event), EU grant for cable share, gas price spike (hurts YOU now if Dependence high — completes the loop), cloudy month in Samegrelo, Black Sea storm (offshore wind offline 1 turn). Every event still ends with a real **fact card** (79% hydro / 100% gas imported / cable FID April 2026 / winter deficit...).

## 10. Failure & lesson system (teammate's spec, kept lightweight)

Every failure (blackout, protest, missed contract, bankruptcy) produces one plain-language "what happened and why" card with a real-world parallel — 2 sentences + optional "learn more" fact. No forced mini-lessons/quizzes overnight; the *mechanics* are the lesson.

## 11. Screens (9)

Title → Region select (3D globe-lite or card map) → **Main: 3D diorama + DOM HUD** → Turn resolution → Event/interstitial cards → Act transition splash → World export map (Act III) → Win/Lose → Leaderboard/end card. Language toggle ქა/EN everywhere, localStorage autosave, instant restart.

## 12. Look & feel

Low-poly 3D diorama per region (Islanders/Monument-Valley-adjacent), warm Georgian palette, day/night cycle tied to seasons, buildings from CC0 packs restyled with a shared toon/flat material so everything matches. Prosperity is VISIBLE: village windows light up, turbines spin faster in wind events, blackout = the diorama actually goes dark (the single most powerful feedback in the game). UI is DOM: crisp, mobile-first, thumb-reachable action bar.

## 13. Win/Lose/Score

WIN = complete Act III contract. Soft end at 36 turns → graded. LOSE = bankruptcy / trust 0 / 3 consecutive blackout quarters. **Legacy Score** = MWh + Trust×20 + CO₂×2 + (100−Dependence)×15 + Prestige×50 → S/A/B/C + shareable end card + local leaderboard.

## 14. Cut from teammate spec (post-hackathon roadmap slide, NOT tonight)

Multiplayer/co-op alliances · treaty/diplomacy system beyond one contract card · adaptive learning paths · creator mode · live weather API (simulated seasons instead) · historical scenario campaigns · interactive science experiments as tech gates · biodiversity simulation (folded into Trust/event cards). These go on the "roadmap" slide — they IMPROVE the commercialization story as future DLC/school-edition features.

## 15. Commercialization (jury slide)

Steam/itch indie edutainment + school licenses (Ministry of Ed energy-literacy module) + GNERC/donor awareness campaigns (USAID/EU4Energy) + sponsored "country packs" (the engine is data-driven — Armenia/Moldova/Kazakhstan editions are data files) + the roadmap features above.
