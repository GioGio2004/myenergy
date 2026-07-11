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
import { DioramaView } from '../scene/DioramaView'

export function GameScreen() {
  const { lang, state, panel, summaryOpen, setPanel } = useStore()
  if (!state) return null
  const home = regionById(state.regions[0])
  return (
    <div className="screen game-screen">
      <Hud />
      <main className="game-main">
        <div className="diorama-stack" onClick={panel ? () => setPanel(null) : undefined}>
          <DioramaView />
          <span className="diorama-label">{lang === 'ka' ? home.nameKa : home.nameEn}</span>
        </div>
        {panel === 'build' && <BuildPanel />}
        {panel === 'trust' && <TrustPanel />}
        {panel === 'market' && <MarketPanel />}
        <Toast />
      </main>
      <ActionBar />
      {summaryOpen && state.lastReport && <TurnSummary />}
      {state.gameOver && !summaryOpen && <GameOverCard />}
    </div>
  )
}
