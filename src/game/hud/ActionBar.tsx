import { useStore } from '../../store'
import { t } from '../../engine/strings'

export function ActionBar() {
  const { lang, dispatch, state } = useStore()
  const over = Boolean(state?.gameOver)
  // Build/Trust/Market panels arrive with the M1 engine; disabled buttons always
  // show WHY (dev rules §4.4)
  return (
    <nav className="action-bar">
      <button className="btn" disabled title={t('comingM1', lang)}>
        🏗 {t('build', lang)}
      </button>
      <button className="btn" disabled title={t('comingM1', lang)}>
        🤝 {t('trust', lang)}
      </button>
      <button className="btn" disabled title={t('comingM1', lang)}>
        ⚖️ {t('market', lang)}
      </button>
      <button
        className="btn btn-primary btn-endturn"
        disabled={over}
        onClick={() => dispatch({ type: 'endTurn' })}
      >
        ⏭ {t('endTurn', lang)}
      </button>
    </nav>
  )
}
