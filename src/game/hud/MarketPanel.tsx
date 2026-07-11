import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { hasBuilt, storageCapacity } from '../../engine/engine'
import * as D from '../../engine/data'
import type { StringKey } from '../../engine/strings'

const CUSTOMER_TEXT: Record<'armenia' | 'eu', StringKey> = { armenia: 'customerArmenia', eu: 'customerEu' }
const CUSTOMER_ICON: Record<'armenia' | 'eu', string> = { armenia: '🇦🇲', eu: '🇪🇺' }

export function MarketPanel() {
  const { lang, state, dispatch, setMapOpen } = useStore()
  if (!state) return null
  const peaker = hasBuilt(state, 'gaspeaker')
  const link = hasBuilt(state, 'translink')
  const cable = hasBuilt(state, 'cableshare')
  const capacity = storageCapacity(state)
  const cold = state.effects.some((e) => e.event === 'coldsnapTR')
  const spot = state.spotPrice * (cold ? D.COLDSNAP_SPOT_MULT : 1)

  const contractWhy = (customer: 'armenia' | 'eu'): string | null => {
    if (state.contract) return t('rejContractActive', lang)
    if (customer === 'armenia' && !link) return t('rejNeedsTranslink', lang)
    if (customer === 'eu' && !cable) return t('rejNeedsCable', lang)
    return null
  }

  return (
    <section className="panel">
      <h3 className="panel-title">⚖️ {t('marketPanelTitle', lang)}</h3>
      {state.act >= 2 && (
        <button className="btn btn-small map-btn" onClick={() => setMapOpen(true)}>
          🗺️ {t('worldMapBtn', lang)}
        </button>
      )}

      {/* Gas peaker toggle */}
      <div className="market-block">
        <div className="market-head">
          <span>🔥 {t('gasToggleTitle', lang)}</span>
          <button
            className={`toggle ${state.gasOn ? 'on' : ''}`}
            onClick={() => dispatch({ type: 'toggleGas', on: !state.gasOn })}
            aria-pressed={state.gasOn}
          >
            <i />
          </button>
        </div>
        <p className="panel-note">{t(state.gasOn ? 'gasToggleOn' : 'gasToggleOff', lang)}</p>
        {!peaker && <p className="panel-note dim">({t('noPeakerNote', lang)})</p>}
      </div>

      {/* Surplus policy */}
      <div className="market-block">
        <div className="market-head">
          <span>♻️ {t('surplusTitle', lang)}</span>
        </div>
        <div className="segmented">
          <button
            className={state.surplusPolicy === 'store' ? 'seg on' : 'seg'}
            onClick={() => dispatch({ type: 'setSurplusPolicy', policy: 'store' })}
          >
            🔋 {t('policyStore', lang)}
          </button>
          <button
            className={state.surplusPolicy === 'sell' ? 'seg on' : 'seg'}
            onClick={() => dispatch({ type: 'setSurplusPolicy', policy: 'sell' })}
          >
            💱 {t('policySell', lang)}
          </button>
        </div>
        {state.surplusPolicy === 'sell' && !link && <p className="panel-note warn-text">⚠️ {t('sellNeedsLink', lang)}</p>}
        {state.surplusPolicy === 'store' && capacity === 0 && (
          <p className="panel-note warn-text">⚠️ {t('storeNeedsBattery', lang)}</p>
        )}
        <p className="panel-note">
          {t('spotPriceLabel', lang)}: <b>₾{spot.toFixed(2)}/kWh</b> {cold && '🥶 ×2'}
        </p>
        {capacity > 0 && (
          <p className="panel-note">
            {t('storedLabel', lang)}: <b>{Math.round(Math.min(state.storedMWh, capacity))}/{capacity} MWh</b>
          </p>
        )}
      </div>

      {/* Dependence explainer */}
      <div className="market-block">
        <div className="market-head">
          <span>🔥 {t('dependence', lang)}: {Math.round(state.dependence)}/100</span>
        </div>
        <div className="trust-bar dep-bar">
          <i style={{ width: `${state.dependence}%` }} />
        </div>
        <p className="panel-note">{t('dependenceNote', lang)}</p>
      </div>

      {/* Contracts */}
      <div className="market-block">
        <div className="market-head">
          <span>📜 {t('contractsTitle', lang)}</span>
        </div>
        {state.contract ? (
          <p className="panel-note">
            ✅ {t('contractActiveLabel', lang)}: {CUSTOMER_ICON[state.contract.customer]}{' '}
            {t(CUSTOMER_TEXT[state.contract.customer], lang)} · {state.contract.quartersLeft}{' '}
            {t('quartersLeftLabel', lang)}
          </p>
        ) : (
          (['armenia', 'eu'] as const).map((c) => {
            const def = D.CONTRACTS[c]
            const why = contractWhy(c)
            return (
              <div key={c} className={`build-row contract-row ${why ? 'locked' : ''}`}>
                <span className="build-icon">{CUSTOMER_ICON[c]}</span>
                <span className="build-info">
                  <span className="build-name">{t(CUSTOMER_TEXT[c], lang)}</span>
                  <span className="build-numbers">
                    {t('volumeLabel', lang)} {def.volume} {t('mwhPerQuarter', lang)} · {t('priceLabel', lang)} ₾{def.price}/kWh ·{' '}
                    {def.quarters}q · {t('penaltyLabel', lang)} ₾{def.penalty.toLocaleString()}
                  </span>
                  {why && <span className="build-why">🔒 {why}</span>}
                </span>
                {!why && (
                  <button className="btn btn-small" onClick={() => dispatch({ type: 'signContract', customer: c })}>
                    {t('signContract', lang)}
                  </button>
                )}
              </div>
            )
          })
        )}
        <p className="panel-note dim">{t('contractWarning', lang)}</p>
      </div>
    </section>
  )
}
