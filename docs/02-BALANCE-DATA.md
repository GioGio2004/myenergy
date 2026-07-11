# DENI — Balance & Data Tables v2.0
All game data is DATA, not code. These tables become `src/engine/data.ts` verbatim. Tune here only.

> Compression note: time-value compressed ~×3 vs reality so a run is 12–18 min, but **ratios stay honest** (solar = slow & safe, gas = cheap & trapping, HPP = big & trust-gated, export = lucrative & risky). One fact card admits the compression.

## 1. Global constants

```
START_MONEY = 10000        MAX_TURNS = 36        BASE_PRICE = 0.30   // GEL/kWh
WINTER_PRICE_MULT = 1.4    TRUST_DECAY = 2       CO2_PER_MWH = 0.4   // t avoided
GAS_COST_PER_MWH = 220     // GEL, covering deficit with imported gas (peaker fuel)
GAS_CO2_PER_MWH  = 0.45    // t emitted
BLACKOUT_TRUST_HIT = -8    BLACKOUT_PROSPERITY_HIT = -1
DEPENDENCE_STEP = +6 per quarter gas covers >20% of demand, −3 per clean quarter
ACT1_WIN = meet 100% demand 3 consecutive quarters
ACT2_WIN = 2 regions each ≥90% self-covered + storage ≥ 200 MWh built
ACT3_WIN = cable share bought + 4-quarter EU contract fulfilled
```

## 2. Regions (7)

| id | name_ka | sun | wind | water | coast | baseTrust | demand start MWh/q | quirk |
|---|---|---|---|---|---|---|---|---|
| kakheti | კახეთი | 9 | 4 | 3 | – | 60 | 600 | hail ×2 chance |
| kartli | ქართლი | 6 | 9 | 4 | – | 65 | 650 | wind −10% cost (Gori precedent) |
| javakheti | სამცხე-ჯავახეთი | 7 | 8 | 5 | – | 55 | 550 | winter demand ×1.25 (harsh) |
| imereti | იმერეთი | 5 | 4 | 8 | – | 45 | 700 | hydro +10 trust needed (Namakhvani) |
| racha | რაჭა | 4 | 3 | 9 | – | 40 | 350 | hydro +10 trust; community actions ×1.5 |
| adjara | აჭარა | 4 | 5 | 7 | ✓ | 50 | 600 | solar −10%; hydro winter 0.8 not 0.6; cable landing |
| samegrelo | სამეგრელო | 3 | 5 | 8 | ✓ | 55 | 620 | the solar trap: sun 3 punishes copy-paste; cable landing |

**Demand growth:** +4%/quarter baseline, +2% extra per prosperity level. Winter demand ×1.3 (×1.25 extra in javakheti).
**Prosperity** (per region, 0–5): +1 per 4 consecutive fully-covered quarters; −1 per blackout. Visual: village lights/factories appear. Feeds demand growth AND score.

## 3. Seasons (unchanged v1) 

winter 0.5/0.6/1.1 price×1.4 · spring 1.0/1.4/1.0 · summer 1.3/0.9/0.8 · autumn 0.9/0.8/1.0 ×1.1 (solar/hydro/wind). Start in spring. Offshore wind uses wind column ×1.2 winter, ×1.0 else.

## 4. Buildables

Slot types: field(sun), ridge(wind), river(water), coast. Slot quality ⭐1–3 multiplies output ×0.6/×1.0/×1.3, always labeled with a why-string.

| id | act | cost ₾ | share | needs | slot | baseOutput MWh/q | upkeep/q | notes |
|---|---|---|---|---|---|---|---|---|
| rooftop | I | 10000 | 100% | – | field | 8 | 0 | tutorial buy |
| gig | I | 2000 | 100% | – | – | 0 | 0 | +3500 next turn, max 2/turn |
| commsolar | I | 60000 | 100% | trust 50 | field | 140 | 500 | +3 trust on build |
| turbine | I | 120000 | 100% | trust 55, wind≥6 | ridge | 320 | 1500 | |
| gaspeaker | I | 40000 | 100% | – | field | on-demand up to 400 | 800 + fuel 220/MWh | fills deficit automatically if ON; +Dependence. The seductive wrong answer |
| solarfarm | II | 300000 | 60% | trust 60, track 500 | field | 1300 | 4000 | PPA price locked 0.28 |
| windfarm | II | 900000 | 50% | trust 65, wind≥7, track 1500 | ridge | 3800 | 12000 | |
| battery | II | 150000 | 100% | any farm | – | stores 250 MWh | 1000 | charge surplus, discharge deficit/winter |
| pumpedhydro | II | 400000 | 60% | water≥7, trust 60 | river | stores 800 MWh | 2500 | Georgia's terrain superpower |
| translink | II | 250000 | 70% | Act II | – | links 2nd region, 8% loss | 2000 | |
| hpp | II/III | 2000000 | 25% | **trust 75(+10 imereti/racha) + EIA + 2 community actions**, water≥7, track 3000 | river | 6500 | 15000 | Namakhvani gate, 2-turn build |
| offshore | III | 1200000 | 40% | coast region, trust 70, track 4000 | coast | 4200 | 18000 | Black Sea; storm event risk |
| cableshare | III | 1500000 | 15% | Dependence<40, track 6000, both-region reliability | coast | – | 5000 | real project: $2.3B, EU PMI, FID Apr 2026 → unlocks EU contract |

Trust actions: unchanged v1 (townhall 500/+5, school 3000/+10, EIA 8000/+8+flag, hiring +6/−10%rev, revshare +12/−15%rev). Awareness bonus: trust ≥80 → +10% region output.

## 5. Export contracts (Act III; Turkey available from Act II)

| customer | needs | price GEL/kWh | volume MWh/q | length | reliability clause |
|---|---|---|---|---|---|
| Turkey spot | translink built | 0.25–0.55 (volatile, event-driven) | any surplus | per-turn | none — but no guaranteed income |
| Armenia PPA | translink | 0.28 fixed | 300 | 4q | miss → −₾20k penalty |
| **EU via cable** | cableshare | **0.48 premium** | 1200 | 4q | miss a quarter → −₾80k + Prestige −1; fulfil all 4 → WIN |

Selling exports uses SURPLUS only; committing volume you cover with gas = allowed but Dependence rockets and profit ≈ 0 (price 0.48 − gas 0.22 − losses… the math is the lesson).

## 6. Events (v1 table +)

| id | weight | condition | effect |
|---|---|---|---|
| coldsnapTR | 2 | translink, winter | Turkey spot ×2 for 1 turn — sell or hold? |
| enguriLow | 2 | any, spring | national supply tight: prices ×1.3, fact card (real 2025 event) |
| gasspike | 2 | – | gas fuel cost ×1.5 for 2 turns — hurts in proportion to YOUR Dependence |
| stormBS | 2 | offshore built | offshore offline 1 turn |
| euGrantCable | 1 | Act III | −30% cableshare cost if trust avg ≥70 |
| cloudsSamegrelo | 3 | samegrelo solar built | solar −40% this turn ("we told you") |
| …plus all v1 events (hail, drought, elections, viral, inspection, protest-scripted) | | | |

Facts list grows to 16 real facts incl.: 79% hydro / ~20% gas mix · gas ~100% imported (84% Azerbaijan) · winter deficit & Enguri ≈40% · cable 1155 km, $2.3B, EU PMI Dec 2025, FID Apr 2026, online 2029 · Gori wind farm first in Georgia · Namakhvani 2020–21 timeline.

## 7. Sim targets (`sim/sim.ts` must verify; 500 seeds × strategy × region)

1. **Balanced bot** completes Act III ≤34 turns in ≥60% seeds (easy regions), ≥35% (imereti/racha/samegrelo).
2. **Gas-crutch bot** (peaker-covers-everything): survives but Dependence >70, grade ≤B, gasspike events cost it ≥25% of profit — the trap works but isn't instant death.
3. **Rush-HPP bot** triggers protest ≥55% of attempts; ends grade ≤C.
4. **Over-exporter bot** (commits EU volume without storage) suffers ≥1 home blackout in ≥70% of seeds.
5. **Solar-only-in-samegrelo bot** fails Act I by turn 10 in ≥80% seeds (the suitability lesson enforces itself).
6. Fuzzer: 2000 random-legal-action games, all regions: no throw, no NaN, no negative-money-without-gameover, terminates ≤36 turns, trust/dependence always 0–100.

Fail → tune THIS file, never the engine.
