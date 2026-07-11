import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { REGIONS } from '../../engine/data'

// Act II second-region picker. One expansion only (engine enforces).
export function ExpandModal() {
  const { lang, state, dispatch, setExpandOpen } = useStore()
  if (!state) return null
  const close = () => setExpandOpen(false)
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">🗺️ {t('expandTitle', lang)}</h3>
        <p className="panel-note center">{t('expandHint', lang)}</p>
        <div className="panel-list">
          {REGIONS.filter((r) => !state.regions.includes(r.id)).map((r) => (
            <button
              key={r.id}
              className="region-card"
              onClick={() => {
                dispatch({ type: 'expandRegion', region: r.id })
                close()
              }}
            >
              <span className="region-name">
                {lang === 'ka' ? r.nameKa : r.nameEn} {r.coast && '🏖'}
              </span>
              <span className="region-stats">
                <span className="region-stat">☀ {r.sun}</span>
                <span className="region-stat">💨 {r.wind}</span>
                <span className="region-stat">🌊 {r.water}</span>
              </span>
              <span className="region-quirk">{lang === 'ka' ? r.quirkKa : r.quirkEn}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={close}>
          {t('back', lang)}
        </button>
      </div>
    </div>
  )
}
