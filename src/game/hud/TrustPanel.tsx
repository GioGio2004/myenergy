import { useState } from 'react'
import { useStore } from '../../store'
import { TRUST_ACTION_TEXT, pick, t } from '../../engine/strings'
import * as D from '../../engine/data'
import type { RegionId, TrustActionId } from '../../engine/types'
import { cityStats } from '../../engine/engine'
import { RegionTabs } from './RegionTabs'
import { Icon, type IconName } from '../ui/Icon'

const ORDER: TrustActionId[] = ['townhall', 'school', 'eia', 'hiring', 'revshare']
const ACTION_ICON: Record<TrustActionId, IconName> = {
  townhall: 'people',
  school: 'info',
  eia: 'leaf',
  hiring: 'jobs',
  revshare: 'money',
}

function retentionPercent(multiplier: number) {
  const percent = multiplier * 100
  return Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)
}

export function TrustPanel() {
  const { lang, state, viewRegion, dispatch, setViewRegion } = useStore()
  const [reviewing, setReviewing] = useState<TrustActionId | null>(null)
  if (!state) return null
  const region: RegionId = viewRegion && state.regions.includes(viewRegion) ? viewRegion : state.regions[0]
  const rs = state.regionState[region]!
  const stats = cityStats(state, region)

  return (
    <section className="panel">
      <h3 className="panel-title"><Icon name="handshake" size={19} className="panel-title-icon" /> {t('trustPanelTitle', lang)}</h3>
      <RegionTabs value={region} onChange={(id) => { setViewRegion(id); setReviewing(null) }} />

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
        {rs.eiaDone && <> · <Icon name="check" size={13} className="inline-check" /> {t('eiaFlag', lang)}</>}
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
          const permanent = id === 'hiring' || id === 'revshare'
          const penalty = def.revenueMult ? Math.round((1 - def.revenueMult) * 100) : 0
          const currentRetention = (rs.hiring ? 0.9 : 1) * (rs.revshare ? 0.85 : 1)
          const afterRetention = currentRetention * (def.revenueMult ?? 1)
          const baselineRevenue = stats.projectedRevenue
          const estimatedLoss = Math.round(baselineRevenue * (penalty / 100))
          const isReviewing = reviewing === id
          const starter = state.turn === 1 && state.plants.length === 0 && rs.trust < 50 && id === 'school' && !why
          return (
            <button
              key={id}
              className={`build-row build-main trust-decision ${why ? 'locked' : ''} ${isReviewing ? 'reviewing' : ''} ${starter ? 'starter-choice' : ''}`}
              disabled={Boolean(why)}
              onClick={() => {
                if (permanent && !isReviewing) setReviewing(id)
                else {
                  dispatch({ type: 'trustAction', action: id, region })
                  setReviewing(null)
                }
              }}
            >
              <span className="build-icon build-icon-svg"><Icon name={ACTION_ICON[id]} size={22} /></span>
              <span className="build-info">
                <span className="build-name">{pick(text.name, lang)} {starter && <em className="starter-badge">★ {t('startHere', lang)}</em>}</span>
                <span className="build-desc">{pick(text.desc, lang)}</span>
                <span className="impact-grid">
                  <span className="impact-chip impact-now">
                    <small>{t('impactNow', lang)}</small>
                    <b>{def.cost > 0 ? `−₾${def.cost.toLocaleString()} · ` : ''}+{gain} {t('trust', lang)}</b>
                    {id === 'hiring' && <em>+{D.LOCAL_HIRING_JOBS} {t('jobsLabel', lang)}</em>}
                    {id === 'revshare' && <em>+{D.REVENUE_SHARE_HAPPINESS} {t('happinessLabel', lang)}</em>}
                  </span>
                  {permanent && (
                    <span className="impact-chip impact-ongoing">
                      <small>{t('impactOngoing', lang)}</small>
                      <b>{t('revenueKeptLabel', lang)} {retentionPercent(currentRetention)}% → {retentionPercent(afterRetention)}%</b>
                      <em>{baselineRevenue > 0 ? `${t('estimatedLossLabel', lang)} ≈ −₾${estimatedLoss.toLocaleString()}` : `−${penalty}% · ${t('noRevenueYet', lang)}`}</em>
                    </span>
                  )}
                </span>
                {permanent && <span className="permanent-badge">∞ {t('permanentLabel', lang)}</span>}
                {why && <span className="build-why"><Icon name="lock" size={12} /> {why}</span>}
              </span>
              {!why && <span className="build-cta">{permanent ? (isReviewing ? t('applyPolicy', lang) : t('confirmChoice', lang)) : `+${gain}`}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
