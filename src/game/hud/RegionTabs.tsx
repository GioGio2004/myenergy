import { useStore } from '../../store'
import { regionById } from '../../engine/data'
import type { RegionId } from '../../engine/types'

// Region switcher for panels once a 2nd region is unlocked (Act II).
export function RegionTabs({ value, onChange }: { value: RegionId; onChange: (r: RegionId) => void }) {
  const { lang, state } = useStore()
  if (!state || state.regions.length < 2) return null
  return (
    <div className="segmented region-tabs">
      {state.regions.map((r) => {
        const def = regionById(r)
        return (
          <button key={r} className={r === value ? 'seg on' : 'seg'} onClick={() => onChange(r)}>
            {lang === 'ka' ? def.nameKa : def.nameEn}
          </button>
        )
      })}
    </div>
  )
}
