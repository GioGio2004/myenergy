import { useState } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'
import type { StringKey } from '../../engine/strings'
import { effectiveCost, hppRejection } from '../../engine/engine'
import * as D from '../../engine/data'

// The scripted Namakhvani interstitial — the demo centerpiece (docs/01 §7,
// NEVER CUT). Rush = 65% protest, capital burns; Right = the trust gate.
export function NamakhvaniModal() {
  const { lang, state, viewRegion, dispatch, setHppOpen } = useStore()
  const [outcome, setOutcome] = useState<'protest' | 'started' | null>(null)
  if (!state) return null
  const region = viewRegion && state.regions.includes(viewRegion) ? viewRegion : state.regions[0]
  const rs = state.regionState[region]!
  const cost = effectiveCost(state, 'hpp', region)
  const needTrust = D.HPP_TRUST_BASE + (D.REGION_HPP_TRUST_EXTRA[region] ?? 0)

  const rushWhy = hppRejection(state, region, 'rush')
  const rightWhy = hppRejection(state, region, 'right')

  const choose = (choice: 'rush' | 'right') => {
    dispatch({ type: 'buildHpp', region, choice })
    const after = useStore.getState().state
    if (!after) return
    setOutcome(after.hpp.protested && !state.hpp.protested ? 'protest' : 'started')
  }

  const close = () => {
    setOutcome(null)
    setHppOpen(false)
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card nmk-card" onClick={(e) => e.stopPropagation()}>
        {outcome === null ? (
          <>
            <h3 className="modal-title">💧 {t('nmkTitle', lang)}</h3>
            <p className="nmk-story">{t('nmkStory', lang)}</p>
            <p className="panel-note center">
              ₾{cost.toLocaleString()} · {D.BUILDABLES.hpp.baseOutput.toLocaleString()} {t('mwhPerQuarter', lang)} ·{' '}
              {t('yourShare', lang)} {Math.round(D.BUILDABLES.hpp.share * 100)}%
            </p>

            <button className="btn nmk-choice nmk-rush" disabled={Boolean(rushWhy)} onClick={() => choose('rush')}>
              <b>⚡ {t('nmkRush', lang)}</b>
              <span>{t('nmkRushDesc', lang)}</span>
              {rushWhy && <span className="build-why">🔒 {t(rushWhy as StringKey, lang)}</span>}
            </button>

            <button className="btn nmk-choice nmk-right" disabled={Boolean(rightWhy)} onClick={() => choose('right')}>
              <b>🤝 {t('nmkRight', lang)}</b>
              <span>{t('nmkRightDesc', lang)}</span>
              <span className="panel-note">
                🤝 {Math.round(rs.trust)}/{needTrust} · 📋 {rs.eiaDone ? '✅' : '—'} · 🗣️ {Math.min(rs.communityActions, 2)}/2
              </span>
              {rightWhy && <span className="build-why">🔒 {t(rightWhy as StringKey, lang)}</span>}
            </button>

            <button className="btn btn-ghost" onClick={close}>
              {t('back', lang)}
            </button>
          </>
        ) : (
          <>
            <h3 className="modal-title">{outcome === 'protest' ? '✊' : '🏗️'} {t('nmkTitle', lang)}</h3>
            <p className="nmk-story">{t(outcome === 'protest' ? 'nmkProtest' : 'nmkStarted', lang)}</p>
            <button className="btn btn-primary modal-btn" onClick={close}>
              {t('nmkClose', lang)}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
