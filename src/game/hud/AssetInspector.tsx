import { useState } from 'react'
import { useStore } from '../../store'
import { BUILDABLE_TEXT, pick, t } from '../../engine/strings'
import { BUILDABLES, SLOT_QUALITY_MULT, regionById } from '../../engine/data'
import { demolitionCost, regionStaffing } from '../../engine/engine'

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
  const staffing = regionStaffing(state, plant.region)
  const rated = stars ? def.baseOutput * SLOT_QUALITY_MULT[stars] : def.baseOutput
  // What it actually makes right now = rated × how well the region can staff it.
  const output = Math.round(rated * (def.baseOutput > 0 && def.kind !== 'storage' && def.kind !== 'gas' && def.kind !== 'infra' ? staffing : 1))
  const understaffed = staffing < 1 && plant.turnsLeft === 0 && def.baseOutput > 0 && def.kind !== 'storage' && def.kind !== 'gas' && def.kind !== 'infra'
  const totalTurns = def.buildTurns ?? 1
  const buildPct = plant.turnsLeft > 0 ? Math.round(((totalTurns - plant.turnsLeft) / totalTurns) * 100) : 100

  return (
    <aside className="asset-inspector">
      <button className="inspector-close" aria-label={t('cancelLabel', lang)} onClick={() => selectPlant(null)}>×</button>
      <small>{t('assetInspectorTitle', lang)}</small>
      <h3>{copy.icon} {pick(copy.name, lang)}</h3>
      <span className={`asset-status ${plant.turnsLeft > 0 ? 'building' : 'running'}`}>
        {plant.turnsLeft > 0
          ? `◷ ${t('constructionStatus', lang)} · ${t('etaReadyIn', lang)} ${plant.turnsLeft} ${t('quartersShort', lang)}`
          : `● ${t('operationalStatus', lang)}`}
      </span>
      {plant.turnsLeft > 0 && (
        <div className="build-progress" role="progressbar" aria-valuenow={buildPct}>
          <div className="build-progress-fill" style={{ width: `${buildPct}%` }} />
        </div>
      )}
      {def.baseOutput > 0 && <p>⚡ {t('outputPerQuarter', lang)} <b>{output.toLocaleString()} MWh</b></p>}
      {understaffed && (
        <p className="asset-understaffed">⚠ {t('understaffedShort', lang)} · {t('staffedLabel', lang)} {Math.round(staffing * 100)}%</p>
      )}
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
