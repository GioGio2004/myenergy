import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { forecast } from '../../engine/engine'

// Persistent contextual coach: on turn 1 it teaches the loop, and thereafter it
// re-appears whenever the player has a fixable problem (uncovered demand or low
// trust). It stays silent while things are healthy so it never nags.
export function FirstMissionCoach() {
  const {
    lang,
    state,
    viewRegion,
    panel,
    placement,
    selectedPlantId,
    summaryOpen,
    hppOpen,
    expandOpen,
    coachDismissed,
    setPanel,
    dispatch,
    dismissCoach,
  } = useStore()
  if (
    !state ||
    state.gameOver ||
    coachDismissed ||
    panel ||
    placement ||
    selectedPlantId ||
    summaryOpen ||
    hppOpen ||
    expandOpen
  ) return null

  const region = viewRegion && state.regions.includes(viewRegion) ? viewRegion : state.regions[0]
  const rs = state.regionState[region]!
  const f = forecast(state, region)
  const need = Math.max(1, f.demand + f.contractVolume)
  const covered = f.gen + f.storageAvail + f.peakerAvail >= need
  const hasProject = state.plants.some((plant) => plant.region === region && plant.type !== 'gig')
  const needsTrust = rs.trust < 50

  let step: 'build' | 'trust' | 'run'
  if (state.turn === 1 && hasProject && covered) step = 'run' // teach the loop the first quarter
  else if (!hasProject || !covered) step = 'build'
  else if (needsTrust) step = 'trust'
  else return null // healthy — don't nag

  const copy = step === 'run' ? 'coachRun' : step === 'trust' ? 'coachCommunity' : 'coachBuild'
  const btn = step === 'run' ? 'runFirstQuarter' : step === 'trust' ? 'openCommunity' : 'openBuild'

  return (
    <aside className="first-mission-coach" aria-live="polite">
      <span className="coach-mascot" aria-hidden="true">⚡</span>
      <span className="coach-copy">
        <small>{t('coachTitle', lang)}</small>
        <strong>{t(copy, lang)}</strong>
      </span>
      <button
        className="btn btn-primary btn-small"
        onClick={() => {
          if (step === 'run') dispatch({ type: 'endTurn' })
          else setPanel(step === 'trust' ? 'trust' : 'build')
        }}
      >
        {t(btn, lang)}
      </button>
      <button
        className="coach-close"
        type="button"
        aria-label={t('close', lang)}
        title={t('close', lang)}
        onClick={dismissCoach}
      >
        ✕
      </button>
    </aside>
  )
}
