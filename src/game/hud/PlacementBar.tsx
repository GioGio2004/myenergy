import { useStore } from '../../store'
import { BUILDABLE_TEXT, pick, t } from '../../engine/strings'
import { BUILDABLES, regionById } from '../../engine/data'
import { effectiveCost, slotOccupied } from '../../engine/engine'

export function PlacementBar() {
  const { lang, state, placement, cancelPlacement } = useStore()
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
        <b>{pick(text.name, lang)} · ₾{effectiveCost(state, placement.buildable, placement.region).toLocaleString()}</b>
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
