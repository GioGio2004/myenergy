import { useStore } from '../../store'
import { t } from '../../engine/strings'

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
    setPanel,
    dispatch,
  } = useStore()
  if (
    !state ||
    state.turn !== 1 ||
    state.lastReport ||
    state.gameOver ||
    panel ||
    placement ||
    selectedPlantId ||
    summaryOpen ||
    hppOpen ||
    expandOpen
  ) return null

  const region = viewRegion && state.regions.includes(viewRegion) ? viewRegion : state.regions[0]
  const needsTrust = state.regionState[region]!.trust < 50
  const hasProject = state.plants.some((plant) => plant.region === region && plant.type !== 'gig')
  const copy = hasProject ? 'coachRun' : needsTrust ? 'coachCommunity' : 'coachBuild'

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
          if (hasProject) dispatch({ type: 'endTurn' })
          else setPanel(needsTrust ? 'trust' : 'build')
        }}
      >
        {t(hasProject ? 'runFirstQuarter' : needsTrust ? 'openCommunity' : 'openBuild', lang)}
      </button>
    </aside>
  )
}
