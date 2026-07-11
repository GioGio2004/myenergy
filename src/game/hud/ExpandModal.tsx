import { useState } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'
import type { RegionId } from '../../engine/types'
import { GeorgiaRegionMap, RegionResourcePreview } from '../map/GeorgiaRegionMap'

// Act II second-region picker. The player previews a real place on the same map
// used at game start, then confirms; one expansion only (the engine enforces it).
export function ExpandModal() {
  const { lang, state, dispatch, setExpandOpen, setViewRegion } = useStore()
  const [selected, setSelected] = useState<RegionId | null>(null)
  if (!state) return null

  const close = () => setExpandOpen(false)
  const confirm = () => {
    if (!selected) return
    dispatch({ type: 'expandRegion', region: selected })
    setViewRegion(selected)
    close()
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={close}
      onKeyDown={(event) => event.key === 'Escape' && close()}
    >
      <div
        className="modal-card expand-region-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expand-region-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="modal-title" id="expand-region-title">🗺️ {t('expandTitle', lang)}</h3>
        <p className="panel-note center">{t('expandHint', lang)}</p>

        <GeorgiaRegionMap
          lang={lang}
          selected={selected}
          onSelect={setSelected}
          disabledRegions={state.regions}
          compact
        />

        {selected ? (
          <RegionResourcePreview lang={lang} regionId={selected} compact />
        ) : (
          <div className="region-preview-empty is-compact" aria-live="polite">
            <h3>{t('regionPreviewEmptyTitle', lang)}</h3>
          </div>
        )}

        <div className="expand-region-actions">
          <button className="btn btn-ghost" type="button" onClick={close}>
            {t('back', lang)}
          </button>
          <button className="btn btn-primary" type="button" disabled={!selected} onClick={confirm}>
            {t('confirmExpansion', lang)} →
          </button>
        </div>
      </div>
    </div>
  )
}
