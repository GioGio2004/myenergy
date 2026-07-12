import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { REGIONS } from '../../engine/data'
import type { RegionId } from '../../engine/types'
import { GeorgiaRegionMap } from '../map/GeorgiaRegionMap'
import { Icon } from '../ui/Icon'

// The "zoom out" national view: from any region the player can pop out to the
// whole country, jump to another region they already run, or — in Act II —
// open the expansion picker. Reuses the accurate Georgia map.
export function NationalMapModal() {
  const { lang, state, viewRegion, setNationalMapOpen, setViewRegion, setExpandOpen } = useStore()
  if (!state) return null

  const canExpand = state.act >= 2 && state.regions.length < REGIONS.length && !state.gameOver
  const unlocked = new Set<RegionId>(state.regions)
  // Locked regions are only tappable when an expansion is actually available.
  const disabledRegions = canExpand ? [] : REGIONS.map((r) => r.id).filter((id) => !unlocked.has(id))

  const close = () => setNationalMapOpen(false)
  const onSelect = (region: RegionId) => {
    if (unlocked.has(region)) {
      setViewRegion(region)
      close()
    } else if (canExpand) {
      close()
      setExpandOpen(true)
    }
  }

  const hint = canExpand
    ? t('nationalMapExpandHint', lang)
    : state.regions.length < 2
      ? t('nationalMapLockedHint', lang)
      : t('nationalMapSwitchHint', lang)

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={close}
      onKeyDown={(event) => event.key === 'Escape' && close()}
    >
      <div
        className="modal-card national-map-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="national-map-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="modal-title" id="national-map-title">
          <Icon name="map" size={18} className="panel-title-icon" /> {t('nationalMapTitle', lang)}
        </h3>
        <p className="panel-note center">{hint}</p>

        <GeorgiaRegionMap
          lang={lang}
          selected={viewRegion}
          onSelect={onSelect}
          disabledRegions={disabledRegions}
          compact
        />

        <div className="national-map-legend" aria-hidden="true">
          <span className="legend-item"><i className="legend-swatch is-here" /> {t('nationalMapActive', lang)}</span>
          <span className="legend-item"><i className="legend-swatch is-net" /> {t('nationalMapUnlocked', lang)}</span>
        </div>

        <div className="national-map-actions">
          <button className="btn btn-primary" type="button" onClick={close}>
            {t('nationalMapClose', lang)}
          </button>
        </div>
      </div>
    </div>
  )
}
