import { useState } from 'react'
import { useStore } from '../../store'
import { TRUST_ACTION_TEXT, pick, t } from '../../engine/strings'
import * as D from '../../engine/data'
import type { RegionId, TrustActionId } from '../../engine/types'
import { RegionTabs } from './RegionTabs'

const ORDER: TrustActionId[] = ['townhall', 'school', 'eia', 'hiring', 'revshare']

export function TrustPanel() {
  const { lang, state, dispatch } = useStore()
  const [selRegion, setSelRegion] = useState<RegionId | null>(null)
  if (!state) return null
  const region = selRegion && state.regions.includes(selRegion) ? selRegion : state.regions[0]
  const rs = state.regionState[region]!

  return (
    <section className="panel">
      <h3 className="panel-title">🤝 {t('trustPanelTitle', lang)}</h3>
      <RegionTabs value={region} onChange={setSelRegion} />

      <div className="trust-meter">
        <div className="trust-bar">
          <i style={{ width: `${rs.trust}%` }} className={rs.trust >= D.AWARENESS_TRUST ? 'glow' : ''} />
        </div>
        <span className="trust-value">{Math.round(rs.trust)}/100</span>
      </div>
      <p className="panel-note">{t('trustDecayNote', lang)}</p>
      <p className="panel-note">{t('awarenessNote', lang)}</p>
      <p className="panel-note">
        {t('communityCount', lang)}: <b>{rs.communityActions}</b>
        {rs.eiaDone && ` · ✅ ${t('eiaFlag', lang)}`}
      </p>

      <div className="panel-list">
        {ORDER.map((id) => {
          const def = D.TRUST_ACTIONS[id]
          const text = TRUST_ACTION_TEXT[id]
          const done = (id === 'eia' && rs.eiaDone) || (id === 'hiring' && rs.hiring) || (id === 'revshare' && rs.revshare)
          const broke = state.money < def.cost
          const why = done ? t('rejOnce', lang) : broke ? `${t('rejMoney', lang)} · ₾${def.cost.toLocaleString()}` : null
          const communityMult = def.community ? (D.REGION_COMMUNITY_MULT[region] ?? 1) : 1
          const gain = Math.round(def.trust * communityMult)
          return (
            <button
              key={id}
              className={`build-row build-main ${why ? 'locked' : ''}`}
              disabled={Boolean(why)}
              onClick={() => dispatch({ type: 'trustAction', action: id, region })}
            >
              <span className="build-icon">{text.icon}</span>
              <span className="build-info">
                <span className="build-name">{pick(text.name, lang)}</span>
                <span className="build-desc">{pick(text.desc, lang)}</span>
                <span className="build-numbers">
                  {def.cost > 0 ? `₾${def.cost.toLocaleString()} · ` : ''}+{gain} {t('trust', lang)}
                </span>
                {why && <span className="build-why">🔒 {why}</span>}
              </span>
              {!why && <span className="build-cta">+{gain}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
