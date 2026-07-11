import { useState } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { forecast, seasonOf, storageCapacity } from '../../engine/engine'
import { isMuted, setMuted } from '../../audio'
import type { Season } from '../../engine/types'
import type { StringKey } from '../../engine/strings'

const SEASON_KEY: Record<Season, StringKey> = {
  spring: 'springName',
  summer: 'summerName',
  autumn: 'autumnName',
  winter: 'winterName',
}
const SEASON_ICON: Record<Season, string> = { spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️' }

export function Hud() {
  const { lang, state, setLang } = useStore()
  const [muted, setMutedUi] = useState(isMuted())
  if (!state) return null
  const season = seasonOf(state.turn)
  const home = state.regions[0]
  const rs = state.regionState[home]!
  const f = forecast(state)
  const capacity = storageCapacity(state)

  // Dial color: green = clean gen covers demand; amber = only with storage+peaker; red = deficit.
  const need = f.demand + f.contractVolume
  const dialClass = f.gen >= need ? 'ok' : f.gen + f.storageAvail + f.peakerAvail >= need ? 'warn' : 'bad'

  return (
    <header className="hud">
      <div className="hud-row hud-top">
        <span className="hud-chip hud-money" title={t('money', lang)}>
          ₾ {state.money.toLocaleString()}
        </span>
        <span className="hud-chip" title={t('turn', lang)}>
          {SEASON_ICON[season]} {t(SEASON_KEY[season], lang)} · {state.turn}
        </span>
        <span className="hud-chip hud-act" title={t('act', lang)}>
          {t('act', lang)} {state.act}
          {state.act === 1 && (
            <span className="act-pips">
              {[1, 2, 3].map((i) => (
                <i key={i} className={i <= state.actProgress ? 'pip on' : 'pip'} />
              ))}
            </span>
          )}
        </span>
        <button
          className="hud-chip hud-lang"
          title={t('soundLabel', lang)}
          onClick={() => {
            setMuted(!muted)
            setMutedUi(!muted)
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="hud-chip hud-lang hud-lang-btn" onClick={() => setLang(lang === 'ka' ? 'en' : 'ka')}>
          {lang === 'ka' ? 'EN' : 'ქა'}
        </button>
      </div>
      <div className="hud-row hud-meters">
        <span className={`hud-chip dial ${dialClass}`} title={`${t('supply', lang)} / ${t('demand', lang)}`}>
          ⚡ {Math.round(f.gen)}/{Math.round(need)}
        </span>
        <span className="hud-chip" title={t('trust', lang)}>
          🤝 {Math.round(rs.trust)}
        </span>
        <span className="hud-chip" title={t('dependence', lang)}>
          🔥 {Math.round(state.dependence)}
        </span>
        <span className="hud-chip" title={t('co2', lang)}>
          🌱 {Math.round(state.co2Avoided).toLocaleString()}
        </span>
        {capacity > 0 && (
          <span className="hud-chip" title={t('storedLabel', lang)}>
            🔋 {Math.round(f.storageAvail)}/{capacity}
          </span>
        )}
      </div>
    </header>
  )
}
