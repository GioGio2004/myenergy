# DENI 2.0 — Georgia's Living Grid

## Product decision

DENI 1.0 was a sound deterministic energy simulation presented through a mostly decorative diorama. DENI 2.0 is a **living, kid-first city-building game** where a player places infrastructure directly into a Georgian region, immediately sees the city react, and then runs a short quarterly resolution to learn whether the plan survives real demand, weather, economics, and community response.

Working promise:

> **Build a living Georgian city. Power the people. Keep their trust. Escape imported energy.**

Primary audience for V2: ages **10–14**, playable without an adult. The learning method is `choice → visible consequence → one-sentence explanation`, not exposition-first panels.

## CTO diagnosis

The first-test problems had two architectural causes:

1. The Three.js world was explicitly designed as a view-only surface. Construction sites were decorative, while real choices happened in text lists.
2. Every screen was globally capped at 560px and there were no desktop breakpoints.

The deterministic engine is worth preserving. It already has seeded randomness, replay, a balanced 36-quarter arc, and meaningful Georgian energy trade-offs. The V2 strategy changes the interaction and feedback layer rather than throwing away the working simulation.

| Player finding | Root cause | V2 response |
|---|---|---|
| Region names, not map, were clickable | No map component existed | Clickable/focusable Georgia SVG with a separate confirmation step |
| Yellow circles did nothing | Markers were explicitly decorative | Hide sites outside build mode; green means available, grey means occupied; click is the build action |
| HUD felt like AI text and city looked dead | Only terse emoji chips; prosperity was hidden; animation stopped | Named city vitals, animated deltas, citizen reactions, pedestrians, cars, and always-moving turbines |
| Hiring/revenue share were unclear | Ongoing penalty existed in engine but not in the numeric decision row | `NOW / EVERY QUARTER` cards, projected GEL cost, permanent-decision confirmation |
| Only End Turn felt consequential | Most macro outcomes are quarterly and immediate mutations had no receipt | Instant cash/trust/jobs/power/happiness deltas plus a continuously visible next-quarter forecast |
| Placement and demolition were not spatial | Site choice was a text sub-list; no demolition action | Direct scene placement, engine-enforced land capacity, asset inspector, paid confirmed demolition |
| Desktop looked like a phone | Global `max-width: 560px` | Full-viewport desktop grid with tool rail, central world, and contextual side panel |

## Benchmark mechanics worth borrowing

The goal is not to clone one game. It is to combine four proven feedback patterns:

- **Mini Motorways:** a growing city is understandable because traffic visibly carries pressure through the network. Borrow visible motion, limited space, and the ability to repair a plan. Official description: <https://dinopoloclub.com/games/mini-motorways/>.
- **ISLANDERS:** placement is a short spatial puzzle and every click produces visual and scoring feedback. Borrow `choose → preview → place → score`. Official site: <https://playislanders.com/>.
- **SimCity BuildIt:** population, happiness, services, opinion bubbles, land constraints, and bulldozing make the city talk back. Official guide: <https://help.ea.com/en/articles/simcity/simcity-buildit/beginner-guide/>.
- **Terra Nil:** the changing world itself is the progress bar. Borrow strong before/after transformation. Official site: <https://www.terranil.com/>.
- **EnerCities:** introduce complexity progressively while balancing People, Planet, Profit, and power supply. It was built for energy awareness among young people, and reported research found increased awareness and willingness to save energy. Project description: <https://paladinstudios.com/enercities/>; study: <https://www.qeam.com/docs/Knol_De_Vries_EnerCities-article-for-eLearningPapers.pdf>.
- **Minecraft Education city planning:** teach by letting a child author a solution under constraints. Lesson library: <https://education.minecraft.net/en-us/lessons/city-planning>.

## The winning hackathon slice

Do not build a broad imitation of Cities: Skylines. Build one exceptionally clear 6–8 minute mission and reuse its systems across regions.

### Judge path: understandable in 90 seconds

1. Click **Kakheti** on the actual Georgia map and see its sun, wind, water, trust, demand, and local risk.
2. Start with a visible mission: **Power every home for three quarters.**
3. Choose community solar. Only compatible field sites appear.
4. Click the best site. Cash drops immediately, the power forecast rises, jobs appear, and a citizen reacts.
5. Open Community and compare local hiring: `+6 trust, +70 jobs now; keep 90% revenue every quarter`.
6. Run the quarter. Homes stay lit or the region visibly suffers a blackout.
7. Click the solar array, inspect it, and show that removing it has a real cost and reliability consequence.

The judge should see region choice, spatial planning, a living city, an ethical/economic trade-off, and energy learning—without narration from the team.

## Core loop

1. **Observe:** read one mission and the live city pulse.
2. **Choose:** select a build, community policy, or market action.
3. **Place:** the world reveals valid and occupied sites.
4. **Predict:** see immediate cost, output, jobs, and projected quarterly effect.
5. **Commit:** the city reacts within 200 ms.
6. **Run quarter:** weather, demand, construction, revenue, reliability, trust, CO₂, and dependence resolve deterministically.
7. **Learn:** receive one causal explanation or earned fact.
8. **Adapt:** repair the city before the next seasonal challenge.

## Hybrid time decision

Keep the seasonal engine rather than switching the economy to an always-running clock.

Why:

- A child can pause and understand causality without being punished while reading.
- Seeded replay and the balanced simulation stay intact.
- Quarterly demand, construction, weather, contracts, and trust decay remain coherent.
- The game can still feel alive through ambient motion, animated construction, immediate forecasts, number deltas, sound, and a short resolution sequence.

The button is therefore **Run quarter**, not **End turn**. A future polish pass should animate the already-computed report over 4–6 seconds instead of showing a static modal.

## City Pulse model

Always show six child-readable vitals:

1. **Money** and projected next-quarter net result.
2. **Power coverage** versus demand.
3. **Population** and movement into/out of the city.
4. **Happiness**, with community trust as its explanation.
5. **Jobs**, including the effect of local hiring and construction.
6. **Clean power**, with dependence and CO₂ as secondary detail.

These are deterministic derived values, not AI-written summaries. They update after every legal action. The quarterly engine remains the source of truth for realized outcomes.

## Spatial rules

- Field, ridge, river, and coast projects require compatible free plots.
- Sites are invisible during exploration so there are no meaningless circles.
- During placement, green rings are clickable free plots and grey rings are occupied plots.
- An unavailable building is disabled with the reason and the available-site count.
- Village-scale assets are capped by local capacity; physical assets cannot be repeated forever.
- Built assets are clickable and open an inspector.
- Demolition costs 12% of the effective investment, with a ₾500 minimum; cancelling construction costs 6%. The original investment is not refunded.
- Removing storage clamps stored energy to the remaining storage capacity.
- The engine validates every operation even if the UI is bypassed.

## Community decisions

Permanent policies use a transaction layout:

### Local hiring

- **Now:** +6 trust, +70 local jobs.
- **Every quarter:** player keeps 90% of regional revenue.
- Show estimated GEL loss using the current projection.
- Require a second confirmation click.

### Revenue sharing

- **Now:** +12 trust and +5 happiness.
- **Every quarter:** player keeps 85% of regional revenue.
- Show estimated GEL loss using the current projection.
- Require a second confirmation click.

The educational point is not “trust is good.” It is that public consent has a visible, recurring economic structure and can still be the better long-term decision.

## Opening rebalance

The old ₾10,000 start made the optimal first minutes a repetitive paid-gig grind. That contradicted the city-building fantasy.

V2 starts with a ₾90,000 development grant and removes gigs from the visible build catalog. A player can place meaningful community solar in the first minute. The engine retains gigs for saved games/bots while the kid-facing flow starts with infrastructure.

## Responsive architecture

### Desktop, 900px+

- Compact living-city HUD across the top.
- Persistent action rail on the left.
- Large interactive Three.js world in the center.
- Build/community/market panel docked on the right.
- Placement and asset inspection overlays stay near the world, not in a phone-sized column.

### Mobile/tablet

- Compact identity and mission first.
- Horizontally scrollable City Pulse.
- World remains central.
- Thumb action bar and bottom sheets remain, with at least 44px targets.

## Delivery status

### Implemented in the current V2 slice

- [x] Interactive, keyboard-accessible Georgia region map.
- [x] Shared map flow for the second region.
- [x] Active-region diorama switching.
- [x] Direct Three.js construction-site interaction.
- [x] Meaningful available/occupied placement markers shown only in placement mode.
- [x] Engine-authoritative territory rejection.
- [x] Clickable built assets and contextual inspector.
- [x] Paid, confirmed demolition and storage safety.
- [x] Population, happiness, jobs, coverage, clean-share, and projected-net metrics.
- [x] Animated immediate deltas and citizen response bubbles.
- [x] Ambient pedestrians, cars, roads, and continuous turbine motion.
- [x] Explicit permanent-policy cost cards.
- [x] Full desktop layout and preserved mobile layout.
- [x] Rebalanced first meaningful build.
- [x] Guided first mission that routes low-trust regions through Community, spotlights the starter choice, then runs the first quarter.

### Next polish sprint — highest return

1. Replace the static turn-summary modal with a 4–6 second animated energy-flow resolution rail.
2. Add a ghost model and exact before/after preview while hovering a free plot.
3. Add site names and accessibility-first projected DOM hit targets over the canvas.
4. Animate construction workers and building scale-in/dust, then add compact sound cues.
5. Add day/night and visible power-line pulses during quarterly resolution.
6. Add citizen bubbles tied to school power, blackout, jobs, protests, and revenue share.
7. Add reducer tests for policy stacking and the full forecast allocator; demolition/full territory are now in the deterministic simulation gate.
8. Add browser flows and screenshots at 390×844, 1024×768, 1366×768, and 1440×900.

### Later, only after the first mission is excellent

- Placement adjacency bonuses and an ISLANDERS-style score preview.
- Roads/power lines as editable networks.
- Upgrades instead of only new buildings.
- Energy Journal with facts earned in context.
- Mission variants for winter resilience, storage, export ethics, and community consent.
- Rich protest/blackout gatherings and region-specific environmental transformation.

## Acceptance bar

- A new player places a valid first building in under 60 seconds without spoken help.
- The mission is understood within 20 seconds.
- Every legal action has visible feedback within 200 ms.
- No visible construction marker is decorative.
- Invalid placement is impossible and its reason is visible.
- Permanent policy choices show their projected GEL cost before confirmation.
- Population, jobs, happiness, and power visibly react to decisions.
- Desktop uses the full viewport; mobile remains playable at 360×640.
- Four of five hallway testers finish the first mission unaided.
- Build, lint, balance simulation, and deterministic replay pass before every demo build.

## Hackathon test protocol

Run five fresh users, ages near the target if possible. The team may only say: “Play until you power the city.” Record:

- Time to choose a region.
- Time to first meaningful build.
- Whether they understand green/grey sites.
- Whether they can explain local hiring's recurring cost.
- Whether they notice population/happiness/jobs changing.
- Whether they can recover from one bad placement or demolition.
- The first moment they smile, point, or verbally predict a consequence.

If fewer than four users finish unaided, cut copy and choices before adding content. More buildings will not fix a weak first minute.
