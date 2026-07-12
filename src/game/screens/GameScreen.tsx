import { useStore } from '../../store'
import { regionById, REGIONS } from '../../engine/data'
import { Hud } from '../hud/Hud'
import { ActionBar } from '../hud/ActionBar'
import { BuildPanel } from '../hud/BuildPanel'
import { TrustPanel } from '../hud/TrustPanel'
import { MarketPanel } from '../hud/MarketPanel'
import { TurnSummary } from '../hud/TurnSummary'
import { GameOverCard } from '../hud/GameOverCard'
import { Toast } from '../hud/Toast'
import { NamakhvaniModal } from '../hud/NamakhvaniModal'
import { ActSplash } from '../hud/ActSplash'
import { ExpandModal } from '../hud/ExpandModal'
import { ExportMapModal } from '../hud/ExportMapModal'
import { NationalMapModal } from '../hud/NationalMapModal'
import { Icon } from '../ui/Icon'
import { PlacementBar } from '../hud/PlacementBar'
import { AssetInspector } from '../hud/AssetInspector'
import { CitizenReaction } from '../hud/CitizenReaction'
import { FirstMissionCoach } from '../hud/FirstMissionCoach'
import { DioramaView } from '../scene/DioramaView'
import { EVENT_TEXT, pick, t } from '../../engine/strings'

export function GameScreen() {
  const { lang, state, viewRegion, placement, selectedPlantId, panel, summaryOpen, hppOpen, actSplash, expandOpen, mapOpen, nationalMapOpen, setExpandOpen, setNationalMapOpen } =
    useStore()
  if (!state) return null
  const active = regionById(viewRegion && state.regions.includes(viewRegion) ? viewRegion : state.regions[0])
  const canExpand = state.act >= 2 && state.regions.length < REGIONS.length && !state.gameOver
  return (
    <div className="screen game-screen">
      <Hud />
      <main className="game-main">
        <div className="diorama-stack">
          <DioramaView />
          <span className="diorama-label">{lang === 'ka' ? active.nameKa : active.nameEn}</span>
          <button
            className="map-zoomout-btn"
            type="button"
            onClick={() => setNationalMapOpen(true)}
            aria-label={t('nationalMapTitle', lang)}
          >
            <Icon name="map" size={16} /> {t('nationalMapBtn', lang)}
          </button>
          {state.effects.length > 0 && (
            <div className="effects-strip">
              {state.effects.map((e, i) => (
                <span key={i} className="effect-chip">
                  {EVENT_TEXT[e.event].icon} {pick(EVENT_TEXT[e.event].name, lang)}
                </span>
              ))}
            </div>
          )}
          {!panel && !placement && !selectedPlantId && state.plants.length > 0 && (
            <span className="scene-hint">⌖ {t('selectAssetHint', lang)}</span>
          )}
          {placement && (
            <div className="placement-cue" role="status" aria-live="polite">
              👇 {t('placementCue', lang)}
            </div>
          )}
          <CitizenReaction />
        </div>
        {canExpand && !panel && (
          <button className="btn expand-banner" onClick={() => setExpandOpen(true)}>
            🗺️ {t('expandBanner', lang)}
          </button>
        )}
        {panel === 'build' && <BuildPanel />}
        {panel === 'trust' && <TrustPanel />}
        {panel === 'market' && <MarketPanel />}
        <PlacementBar />
        <AssetInspector />
        <FirstMissionCoach />
        <Toast />
      </main>
      <ActionBar />
      {hppOpen && <NamakhvaniModal />}
      {expandOpen && <ExpandModal />}
      {nationalMapOpen && <NationalMapModal />}
      {mapOpen && <ExportMapModal />}
      {summaryOpen && state.lastReport && <TurnSummary />}
      {!summaryOpen && actSplash && <ActSplash />}
      {state.gameOver && !summaryOpen && !actSplash && <GameOverCard />}
    </div>
  )
}
