import { useStore } from '../../store'
import { t, type StringKey } from '../../engine/strings'

export function CitizenReaction() {
  const { lang, state, viewRegion, lastChange } = useStore()
  const region = state && (viewRegion && state.regions.includes(viewRegion) ? viewRegion : state.regions[0])
  if (!lastChange || lastChange.kind === 'endTurn' || lastChange.region !== region) return null
  let key: StringKey | null = null
  if (lastChange.kind === 'demolish') key = lastChange.coverage < 0 ? 'reactionRiskUp' : 'reactionDemolished'
  else if (lastChange.trust > 0 || lastChange.happiness > 0) key = 'reactionTrustUp'
  else if (lastChange.coverage > 0) key = 'reactionPowerUp'
  else if (lastChange.jobs > 0) key = 'reactionJobsUp'
  if (!key) return null
  return (
    <div className="citizen-reaction" key={lastChange.id} aria-live="polite">
      <span aria-hidden="true">🧑‍🌾</span>
      <p><small>{t('cityReactedLabel', lang)}</small>{t(key, lang)}</p>
    </div>
  )
}
