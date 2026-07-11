import { useState } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'
import type { RegionId } from '../../engine/types'
import { GeorgiaRegionMap, RegionResourcePreview } from '../map/GeorgiaRegionMap'

export function RegionSelectScreen() {
  const { lang, setScreen, newGame } = useStore()
  const [selected, setSelected] = useState<RegionId | null>(null)

  return (
    <div className="screen region-screen region-screen-v2">
      <header className="region-header region-picker-header">
        <button className="btn btn-ghost" onClick={() => setScreen('title')}>
          ← {t('back', lang)}
        </button>
        <div>
          <h2>{t('chooseRegion', lang)}</h2>
          <p>{t('regionSelectLead', lang)}</p>
        </div>
      </header>

      <main className="region-picker-layout">
        <section className="region-picker-map-panel">
          <GeorgiaRegionMap lang={lang} selected={selected} onSelect={setSelected} />
        </section>

        <aside className="region-picker-detail-panel">
          {selected ? (
            <RegionResourcePreview lang={lang} regionId={selected} />
          ) : (
            <div className="region-preview-empty" aria-live="polite">
              <span aria-hidden="true">🗺️</span>
              <h3>{t('regionPreviewEmptyTitle', lang)}</h3>
              <p>{t('regionPreviewEmptyDesc', lang)}</p>
            </div>
          )}

          <button
            className="btn btn-primary region-start-btn"
            type="button"
            disabled={!selected}
            onClick={() => selected && newGame(selected)}
          >
            {t('startInRegion', lang)} →
          </button>
        </aside>
      </main>
    </div>
  )
}
