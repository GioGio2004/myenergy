import { useState } from 'react'
import { useStore } from '../../store'
import { BUILDABLE_TEXT, pick, t } from '../../engine/strings'
import { BUILDABLES, SLOT_QUALITY_MULT, regionById } from '../../engine/data'
import { demolitionCost } from '../../engine/engine'

export function AssetInspector() {
  const { lang, state, selectedPlantId, dispatch, selectPlant } = useStore()
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const plant = state?.plants.find((p) => p.id === selectedPlantId)
  if (!state || !plant) return null
  const confirming = confirmingId === plant.id

  const def = BUILDABLES[plant.type]
  const copy = BUILDABLE_TEXT[plant.type]
  const cost = demolitionCost(state, plant.id)
  const slot = plant.slot
  const rdef = slot === null ? null : regionById(plant.region)
  const stars = rdef && slot !== null ? rdef.slots[slot]?.stars : null
  const output = stars ? Math.round(def.baseOutput * SLOT_QUALITY_MULT[stars]) : def.baseOutput

  return (
    <aside className="asset-inspector">
      <button className="inspector-close" aria-label={t('cancelLabel', lang)} onClick={() => selectPlant(null)}>×</button>
      <small>{t('assetInspectorTitle', lang)}</small>
      <h3>{copy.icon} {pick(copy.name, lang)}</h3>
      <span className={`asset-status ${plant.turnsLeft > 0 ? 'building' : 'running'}`}>
        {plant.turnsLeft > 0 ? `◷ ${t('constructionStatus', lang)} · ${plant.turnsLeft}` : `● ${t('operationalStatus', lang)}`}
      </span>
      {def.baseOutput > 0 && <p>⚡ {t('outputPerQuarter', lang)} <b>{output.toLocaleString()} MWh</b></p>}
      <div className="demolition-box">
        <span><small>{t('demolishCostLabel', lang)}</small><b>−₾{cost.toLocaleString()}</b></span>
        <p>{t('demolishWarning', lang)}</p>
        <button
          className={`btn ${confirming ? 'btn-danger' : ''}`}
          disabled={state.money < cost}
          onClick={() => {
            if (!confirming) setConfirmingId(plant.id)
            else dispatch({ type: 'demolish', plantId: plant.id })
          }}
        >
          {confirming ? t('demolishConfirm', lang) : t('demolishLabel', lang)}
        </button>
      </div>
    </aside>
  )
}
