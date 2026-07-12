import { useState } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { Icon } from '../ui/Icon'
import type { Panel } from '../../store'

const PANELS: Array<{ id: Panel; icon: string; key: 'build' | 'trust' | 'market' }> = [
  { id: 'build', icon: '🏗', key: 'build' },
  { id: 'trust', icon: '🤝', key: 'trust' },
  { id: 'market', icon: '⚖️', key: 'market' },
]

export function ActionBar() {
  const { lang, dispatch, state, panel, setPanel } = useStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const over = Boolean(state?.gameOver)

  const openPanel = (id: Panel) => {
    setPanel(panel === id ? null : id)
    setDrawerOpen(false)
  }

  return (
    <>
      <nav className="action-bar">
        {/* Wide screens: each tool is its own button (hidden on mobile via CSS). */}
        {PANELS.map((p) => (
          <button
            key={p.id}
            className={`btn action-tool ${panel === p.id ? 'btn-active' : ''}`}
            disabled={over}
            title={over ? t('rejGameOver', lang) : undefined}
            onClick={() => openPanel(p.id)}
          >
            {p.icon} {t(p.key, lang)}
          </button>
        ))}
        {/* Phones: a single trigger opens the tools in a bottom drawer. */}
        <button
          className={`btn action-menu-trigger ${panel ? 'btn-active' : ''}`}
          disabled={over}
          title={over ? t('rejGameOver', lang) : undefined}
          onClick={() => setDrawerOpen(true)}
        >
          <Icon name="menu" size={18} /> {t('actionsMenu', lang)}
        </button>
        <button
          className="btn btn-primary btn-endturn"
          disabled={over}
          title={over ? t('rejGameOver', lang) : undefined}
          onClick={() => dispatch({ type: 'endTurn' })}
        >
          ⏭ {t('endTurn', lang)}
        </button>
      </nav>

      {drawerOpen && (
        <div
          className="action-drawer-scrim"
          onClick={() => setDrawerOpen(false)}
          role="presentation"
        >
          <div
            className="action-drawer"
            role="dialog"
            aria-label={t('actionsMenu', lang)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="action-drawer-head">
              <strong>{t('actionsMenu', lang)}</strong>
              <button
                className="icon-control"
                type="button"
                aria-label={t('close', lang)}
                title={t('close', lang)}
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            {PANELS.map((p) => (
              <button
                key={p.id}
                className={`btn action-drawer-item ${panel === p.id ? 'btn-active' : ''}`}
                disabled={over}
                onClick={() => openPanel(p.id)}
              >
                {p.icon} {t(p.key, lang)}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
