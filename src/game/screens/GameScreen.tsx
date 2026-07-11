import { useStore } from '../../store'
import { regionById } from '../../engine/data'
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
import { DioramaView } from '../scene/DioramaView'
import { t } from '../../engine/strings'

export function GameScreen() {
  const { lang, state, panel, summaryOpen, hppOpen, actSplash, expandOpen, mapOpen, setPanel, setExpandOpen } =
    useStore()
  if (!state) return null
  const home = regionById(state.regions[0])
  const canExpand = state.act >= 2 && state.regions.length < 2 && !state.gameOver
  return (
    <div className="screen game-screen">
      <Hud />
      <main className="game-main">
        <div className="diorama-stack" onClick={panel ? () => setPanel(null) : undefined}>
          <DioramaView />
          <span className="diorama-label">{lang === 'ka' ? home.nameKa : home.nameEn}</span>
        </div>
        {canExpand && !panel && (
          <button className="btn expand-banner" onClick={() => setExpandOpen(true)}>
            🗺️ {t('expandBanner', lang)}
          </button>
        )}
        {panel === 'build' && <BuildPanel />}
        {panel === 'trust' && <TrustPanel />}
        {panel === 'market' && <MarketPanel />}
        <Toast />
      </main>
      <ActionBar />
      {hppOpen && <NamakhvaniModal />}
      {expandOpen && <ExpandModal />}
      {mapOpen && <ExportMapModal />}
      {summaryOpen && state.lastReport && <TurnSummary />}
      {!summaryOpen && actSplash && <ActSplash />}
      {state.gameOver && !summaryOpen && !actSplash && <GameOverCard />}
    </div>
  )
}
