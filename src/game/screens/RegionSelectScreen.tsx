import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { REGIONS } from '../../engine/data'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="region-stat">
      {label} <b>{value}</b>
    </span>
  )
}

export function RegionSelectScreen() {
  const { lang, setScreen, newGame } = useStore()
  return (
    <div className="screen region-screen">
      <header className="region-header">
        <button className="btn btn-ghost" onClick={() => setScreen('title')}>
          ← {t('back', lang)}
        </button>
        <h2>{t('chooseRegion', lang)}</h2>
      </header>
      <div className="region-list">
        {REGIONS.map((r) => (
          <button key={r.id} className="region-card" onClick={() => newGame(r.id)}>
            <span className="region-name">{lang === 'ka' ? r.nameKa : r.nameEn}</span>
            <span className="region-stats">
              <Stat label={`☀ ${t('sun', lang)}`} value={r.sun} />
              <Stat label={`💨 ${t('wind', lang)}`} value={r.wind} />
              <Stat label={`🌊 ${t('water', lang)}`} value={r.water} />
              {r.coast && <span className="region-stat">🏖 {t('coast', lang)}</span>}
            </span>
            <span className="region-quirk">{lang === 'ka' ? r.quirkKa : r.quirkEn}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
