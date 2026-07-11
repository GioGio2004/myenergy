import { useState } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { cityStats, forecast, seasonOf } from '../../engine/engine'
import { regionById } from '../../engine/data'
import { isMuted, setMuted } from '../../audio'
import type { CityStats, Season } from '../../engine/types'
import type { StringKey } from '../../engine/strings'

const SEASON_KEY: Record<Season, StringKey> = {
  spring: 'springName',
  summer: 'summerName',
  autumn: 'autumnName',
  winter: 'winterName',
}
const SEASON_ICON: Record<Season, string> = { spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️' }
const LEVEL_KEY: Record<CityStats['level'], StringKey> = {
  1: 'levelVillage',
  2: 'levelTown',
  3: 'levelCity',
  4: 'levelGreenCity',
  5: 'levelEnergyCapital',
}
const MISSION_KEY: Record<1 | 2 | 3, StringKey> = { 1: 'missionAct1', 2: 'missionAct2', 3: 'missionAct3' }

function Delta({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (!value) return null
  return <span className={`live-delta ${value > 0 ? 'positive' : 'negative'}`}>{value > 0 ? '+' : ''}{value.toLocaleString()}{suffix}</span>
}

export function Hud() {
  const { lang, state, viewRegion, lastChange, setLang } = useStore()
  const [muted, setMutedUi] = useState(isMuted())
  if (!state) return null
  const region = viewRegion && state.regions.includes(viewRegion) ? viewRegion : state.regions[0]
  const regionDef = regionById(region)
  const rs = state.regionState[region]!
  const season = seasonOf(state.turn)
  const f = forecast(state, region)
  const stats = cityStats(state, region)
  const visibleChange = lastChange?.region === region ? lastChange : null
  const need = Math.max(1, f.demand + f.contractVolume)
  const forecastClass = stats.coverage >= 100 ? 'good' : stats.coverage >= 80 ? 'warn' : 'bad'

  return (
    <header className="hud living-hud">
      <div className="hud-command">
        <div className="city-identity">
          <span className="city-region">{lang === 'ka' ? regionDef.nameKa : regionDef.nameEn}</span>
          <span className="city-level">★ {t('cityLevelLabel', lang)} {stats.level} · {t(LEVEL_KEY[stats.level], lang)}</span>
        </div>
        <div className="mission-ribbon">
          <small>🎯 {t('missionTitle', lang)}</small>
          <strong>{t(MISSION_KEY[state.act], lang)}</strong>
        </div>
        <div className="hud-controls">
          <span className="season-badge">{SEASON_ICON[season]} {t(SEASON_KEY[season], lang)} · {state.turn}</span>
          <button
            className="icon-control"
            title={t('soundLabel', lang)}
            onClick={() => {
              setMuted(!muted)
              setMutedUi(!muted)
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button className="icon-control" onClick={() => setLang(lang === 'ka' ? 'en' : 'ka')}>
            {lang === 'ka' ? 'EN' : 'ქა'}
          </button>
        </div>
      </div>

      <div className="city-vitals" key={visibleChange?.id ?? 0}>
        <div className="vital-card cash-vital">
          <span className="vital-icon">₾</span>
          <span className="vital-copy"><small>{t('money', lang)}</small><b>{state.money.toLocaleString()}</b></span>
          <Delta value={visibleChange?.money ?? 0} />
          <span className={`vital-sub ${stats.projectedNet >= 0 ? 'good-text' : 'bad-text'}`}>
            {t('projectedNetLabel', lang)} {stats.projectedNet >= 0 ? '+' : '−'}₾{Math.abs(stats.projectedNet).toLocaleString()}
          </span>
        </div>
        <div className={`vital-card power-vital ${forecastClass}`}>
          <span className="vital-icon">⚡</span>
          <span className="vital-copy"><small>{t('coverageLabel', lang)}</small><b>{stats.coverage}%</b></span>
          <Delta value={visibleChange?.coverage ?? 0} suffix="%" />
          <span
            className="vital-sub"
            title={`🌿 ${Math.round(f.gen).toLocaleString()} + 🔋 ${Math.round(f.storageAvail).toLocaleString()} + 🔥 ${Math.round(f.peakerAvail).toLocaleString()} / ${Math.round(need).toLocaleString()} MWh`}
          >
            🌿{Math.round(f.gen).toLocaleString()} + 🔋{Math.round(f.storageAvail).toLocaleString()} + 🔥{Math.round(f.peakerAvail).toLocaleString()} / {Math.round(need).toLocaleString()} MWh
          </span>
        </div>
        <div className="vital-card">
          <span className="vital-icon">🏘️</span>
          <span className="vital-copy"><small>{t('populationLabel', lang)}</small><b>{stats.population.toLocaleString()}</b></span>
          <Delta value={visibleChange?.population ?? 0} />
        </div>
        <div className="vital-card">
          <span className="vital-icon">{stats.happiness >= 70 ? '😄' : stats.happiness >= 45 ? '🙂' : '😟'}</span>
          <span className="vital-copy"><small>{t('happinessLabel', lang)}</small><b>{stats.happiness}%</b></span>
          <Delta value={visibleChange?.happiness ?? 0} suffix="%" />
          <span className="vital-sub">🤝 {t('trust', lang)} {Math.round(rs.trust)}</span>
        </div>
        <div className="vital-card">
          <span className="vital-icon">👷</span>
          <span className="vital-copy"><small>{t('jobsLabel', lang)}</small><b>{stats.jobs.toLocaleString()}</b></span>
          <Delta value={visibleChange?.jobs ?? 0} />
        </div>
        <div className="vital-card clean-vital">
          <span className="vital-icon">🌿</span>
          <span className="vital-copy"><small>{t('cleanPowerLabel', lang)}</small><b>{stats.cleanShare}%</b></span>
          <span className="vital-sub">🔥 {t('dependence', lang)} {Math.round(state.dependence)} · CO₂ {Math.round(state.co2Avoided).toLocaleString()}t</span>
        </div>
      </div>
    </header>
  )
}
