import { useState } from 'react'
import { useStore } from '../../store'
import { BUILDABLE_TEXT, pick, t } from '../../engine/strings'
import type { StringKey } from '../../engine/strings'
import { buildRejection, effectiveCost, hppRejection, slotOccupied } from '../../engine/engine'
import * as D from '../../engine/data'
import type { BuildableId, GameState, RegionId } from '../../engine/types'

// Ladder order: everything is listed, later-act items visibly locked — the tree
// IS the progression teaser. Disabled rows always show WHY (dev rules §4.4).
const ORDER: BuildableId[] = [
  'gig',
  'rooftop',
  'gaspeaker',
  'commsolar',
  'turbine',
  'battery',
  'solarfarm',
  'translink',
  'pumpedhydro',
  'windfarm',
  'hpp',
  'offshore',
  'cableshare',
]

/** Reject key → display string, with have/need numbers appended when known. */
function whyDisabled(state: GameState, type: BuildableId, region: RegionId, key: string, lang: 'ka' | 'en'): string {
  const def = D.BUILDABLES[type]
  const rs = state.regionState[region]
  const base = t(key as StringKey, lang)
  if (key === 'rejMoney') return `${base} · ₾${effectiveCost(state, type, region).toLocaleString()}`
  if (key === 'rejTrust' && def.needsTrust !== undefined && rs)
    return `${base} · ${Math.round(rs.trust)}/${def.needsTrust}`
  if (key === 'rejTrack' && def.needsTrack !== undefined)
    return `${base} · ${Math.round(state.trackMWh).toLocaleString()}/${def.needsTrack.toLocaleString()}`
  return base
}

function Stars({ n }: { n: 1 | 2 | 3 }) {
  return <span className="slot-stars">{'⭐'.repeat(n)}</span>
}

export function BuildPanel() {
  const { lang, state, dispatch, setHppOpen } = useStore()
  const [expanded, setExpanded] = useState<BuildableId | null>(null)
  if (!state) return null
  const region = state.regions[0] // Act I: home region (multi-region UI lands at M5)
  const rdef = D.regionById(region)

  return (
    <section className="panel">
      <h3 className="panel-title">🏗 {t('buildPanelTitle', lang)}</h3>
      <div className="panel-list">
        {ORDER.map((id) => {
          const def = D.BUILDABLES[id]
          const text = BUILDABLE_TEXT[id]
          // HPP goes through the Namakhvani interstitial; its row gates on rush
          // feasibility (money/water/track/slot) — the interstitial shows the rest.
          const rej = id === 'hpp' ? hppRejection(state, region, 'rush') : buildRejection(state, id, region)
          const cost = effectiveCost(state, id, region)
          const open = expanded === id
          const isStorage = def.kind === 'storage'
          const underConstruction = state.plants.some((p) => p.type === id && p.turnsLeft > 0)

          return (
            <div key={id} className={`build-row ${rej ? 'locked' : ''}`}>
              <button
                className="build-main"
                onClick={() => {
                  if (rej) return
                  if (id === 'hpp') setHppOpen(true)
                  else if (def.slot) setExpanded(open ? null : id)
                  else dispatch({ type: 'build', buildable: id, region })
                }}
                disabled={Boolean(rej)}
              >
                <span className="build-icon">{text.icon}</span>
                <span className="build-info">
                  <span className="build-name">
                    {pick(text.name, lang)}
                    {underConstruction && <em className="build-tag"> {t('buildingLabel', lang)}</em>}
                  </span>
                  <span className="build-desc">{pick(text.desc, lang)}</span>
                  <span className="build-numbers">
                    ₾{cost.toLocaleString()}
                    {def.share < 1 && ` · ${t('yourShare', lang)} ${Math.round(def.share * 100)}%`}
                    {def.baseOutput > 0 &&
                      ` · ${isStorage ? t('storesLabel', lang) : t('outputLabel', lang)} ${def.baseOutput} ${isStorage ? 'MWh' : t('mwhPerQuarter', lang)}`}
                    {def.upkeep > 0 && ` · ${t('upkeepLabel', lang)} ₾${Math.round(def.upkeep * def.share).toLocaleString()}`}
                  </span>
                  {rej && <span className="build-why">🔒 {whyDisabled(state, id, region, rej, lang)}</span>}
                </span>
                {!rej && <span className="build-cta">{def.slot ? '▾' : `+ ${t('buildNow', lang)}`}</span>}
              </button>

              {open && def.slot && (
                <div className="slot-list">
                  <span className="slot-hint">{t('chooseSlot', lang)}:</span>
                  {rdef.slots.map((s, i) => {
                    if (s.type !== def.slot) return null
                    const taken = slotOccupied(state, region, i)
                    return (
                      <button
                        key={i}
                        className="slot-row"
                        disabled={taken}
                        onClick={() => {
                          dispatch({ type: 'build', buildable: id, region, slot: i })
                          setExpanded(null)
                        }}
                      >
                        <Stars n={s.stars} />
                        <span className="slot-why">
                          {lang === 'ka' ? s.whyKa : s.whyEn}
                          {taken && ` — ${t('occupied', lang)}`}
                        </span>
                        <span className="slot-mult">×{D.SLOT_QUALITY_MULT[s.stars]}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
