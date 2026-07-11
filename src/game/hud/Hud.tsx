import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { seasonOf } from '../../engine/engine'
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
  const { lang, state } = useStore()
  if (!state) return null
  const season = seasonOf(state.turn)
  const home = state.regions[0]
  return (
    <header className="hud">
      <div className="hud-row hud-top">
        <span className="hud-chip hud-money" title={t('money', lang)}>
          ₾ {state.money.toLocaleString()}
        </span>
        <span className="hud-chip" title={t('turn', lang)}>
          {SEASON_ICON[season]} {t(SEASON_KEY[season], lang)} · {t('turn', lang)} {state.turn}
        </span>
        <span className="hud-chip hud-act" title={t('act', lang)}>
          {t('act', lang)} {state.act}
          <span className="act-pips">
            {[1, 2, 3].map((a) => (
              <i key={a} className={a <= state.act ? 'pip on' : 'pip'} />
            ))}
          </span>
        </span>
      </div>
      <div className="hud-row hud-meters">
        {/* ⚡ supply-vs-demand dial becomes the HUD star at M2 (needs M1 engine) */}
        <span className="hud-chip">⚡ —/—</span>
        <span className="hud-chip" title={t('trust', lang)}>
          🤝 {state.regionState[home]?.trust ?? 0}
        </span>
        <span className="hud-chip" title={t('dependence', lang)}>
          🔥 {state.dependence}
        </span>
        <span className="hud-chip" title={t('co2', lang)}>
          🌱 {state.co2Avoided}
        </span>
      </div>
    </header>
  )
}
