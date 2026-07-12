import { useEffect } from 'react'
import { useStore } from '../../store'
import { BUILDABLE_TEXT, pick, t } from '../../engine/strings'
import { BUILDABLES, regionById } from '../../engine/data'
import { effectiveCost, slotOccupied } from '../../engine/engine'

export function PlacementBar() {
  const { lang, state, placement, cancelPlacement } = useStore()
  // Escape cancels placement — a standard affordance the bar's Cancel button implies
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cancelPlacement()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelPlacement])
  if (!state || !placement) return null
  const def = BUILDABLES[placement.buildable]
  const text = BUILDABLE_TEXT[placement.buildable]
  const region = regionById(placement.region)
  const sites = region.slots.map((slot, index) => ({ slot, index })).filter(({ slot }) => slot.type === def.slot)
  const available = sites.filter(({ index }) => !slotOccupied(state, placement.region, index))

  return (
    <aside className={`placement-bar ${available.length === 0 ? 'no-sites' : ''}`} role="status" aria-live="polite">
      <span className="placement-icon">{text.icon}</span>
      <span className="placement-copy">
        <small>{t('placementTitle', lang)}</small>
        <b>
          {pick(text.name, lang)} · ₾{effectiveCost(state, placement.buildable, placement.region).toLocaleString()}
          {def.buildTurns !== undefined && def.buildTurns > 0 && ` · 🕑 ${def.buildTurns} ${t('quartersShort', lang)}`}
        </b>
        <em>
          {available.length > 0
            ? `${t('placementInstruction', lang)} · ${available.length}/${sites.length} ${t('sitesAvailable', lang)}`
            : t('placementNoSites', lang)}
        </em>
      </span>
      <button className="btn btn-small" onClick={cancelPlacement}>{t('cancelLabel', lang)}</button>
    </aside>
  )
}
