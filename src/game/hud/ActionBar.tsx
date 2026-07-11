import { useStore } from '../../store'
import { t } from '../../engine/strings'
import type { Panel } from '../../store'

const PANELS: Array<{ id: Panel; icon: string; key: 'build' | 'trust' | 'market' }> = [
  { id: 'build', icon: '🏗', key: 'build' },
  { id: 'trust', icon: '🤝', key: 'trust' },
  { id: 'market', icon: '⚖️', key: 'market' },
]

export function ActionBar() {
  const { lang, dispatch, state, panel, setPanel } = useStore()
  const over = Boolean(state?.gameOver)
  return (
    <nav className="action-bar">
      {PANELS.map((p) => (
        <button
          key={p.id}
          className={`btn ${panel === p.id ? 'btn-active' : ''}`}
          disabled={over}
          title={over ? t('rejGameOver', lang) : undefined}
          onClick={() => setPanel(panel === p.id ? null : p.id)}
        >
          {p.icon} {t(p.key, lang)}
        </button>
      ))}
      <button
        className="btn btn-primary btn-endturn"
        disabled={over}
        title={over ? t('rejGameOver', lang) : undefined}
        onClick={() => dispatch({ type: 'endTurn' })}
      >
        ⏭ {t('endTurn', lang)}
      </button>
    </nav>
  )
}
