import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { hasBuilt } from '../../engine/engine'
import * as D from '../../engine/data'

// Act II/III world map: Georgia and its customers, energy arcs animated in CSS.
// Pure view over state — stylized SVG, not cartography.
export function ExportMapModal() {
  const { lang, state, setMapOpen } = useStore()
  if (!state) return null
  const link = hasBuilt(state, 'translink')
  const cable = hasBuilt(state, 'cableshare')
  const active = state.contract
  const cold = state.effects.some((e) => e.event === 'coldsnapTR')
  const spot = state.spotPrice * (cold ? D.COLDSNAP_SPOT_MULT : 1)
  const close = () => setMapOpen(false)

  const arcClass = (on: boolean, isActive: boolean) => `map-arc ${on ? 'on' : ''} ${isActive ? 'active' : ''}`

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">🗺️ {t('worldMapTitle', lang)}</h3>
        <svg className="world-map" viewBox="0 0 320 210" role="img">
          {/* Black Sea */}
          <path d="M10 30 Q60 10 130 32 L138 96 Q80 122 18 108 Z" fill="#274a5e" opacity="0.9" />
          {/* Europe / Romania (upper left shore) */}
          <path d="M6 6 L96 6 Q70 18 44 24 L6 34 Z" fill="#3c4f3a" />
          {/* Georgia */}
          <path d="M138 60 L196 52 L232 62 L246 84 L212 100 L162 102 L138 96 Z" fill="#5c7a44" stroke="#f2a541" strokeWidth="1.4" />
          {/* Turkey */}
          <path d="M8 120 L180 116 L232 128 L226 168 L60 176 L10 156 Z" fill="#6b5d52" />
          {/* Armenia */}
          <path d="M238 118 L286 116 L296 152 L252 158 L236 136 Z" fill="#5e5546" />

          {/* arcs: Georgia → customer */}
          <path className={arcClass(link, active?.customer === 'armenia')} d="M210 92 Q240 96 262 122" />
          <path className={arcClass(link, false)} d="M180 96 Q160 116 140 128" />
          <path className={arcClass(cable, active?.customer === 'eu')} d="M150 78 Q80 60 30 22" />

          <text x="184" y="80" className="map-label map-label-geo">{t('mapGeorgia', lang)}</text>
          <text x="90" y="150" className="map-label">{t('mapTurkey', lang)}</text>
          <text x="248" y="142" className="map-label">{t('mapArmenia', lang)}</text>
          <text x="16" y="20" className="map-label">{t('mapEurope', lang)}</text>
        </svg>

        <p className="panel-note">
          💱 {t('spotPriceLabel', lang)}: <b>₾{spot.toFixed(2)}/kWh</b> {cold && '🥶 ×2'}
        </p>
        {active ? (
          <p className="panel-note">
            📜 {t('contractActiveLabel', lang)}: {active.customer === 'eu' ? '🇪🇺' : '🇦🇲'} ·{' '}
            {D.CONTRACTS[active.customer].volume} {t('mwhPerQuarter', lang)} · {active.quartersLeft}{' '}
            {t('quartersLeftLabel', lang)}
          </p>
        ) : (
          <p className="panel-note">{t('noExportsYet', lang)}</p>
        )}
        {cable && <p className="panel-note dim">{t('mapCableNote', lang)}</p>}

        <button className="btn btn-primary modal-btn" onClick={close}>
          {t('continueLabel', lang)}
        </button>
      </div>
    </div>
  )
}
