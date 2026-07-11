import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { regionById } from '../../engine/data'
import { Hud } from '../hud/Hud'
import { ActionBar } from '../hud/ActionBar'
import { BuildPanel } from '../hud/BuildPanel'
import { TrustPanel } from '../hud/TrustPanel'
import { MarketPanel } from '../hud/MarketPanel'
import { TurnSummary } from '../hud/TurnSummary'
import { GameOverCard } from '../hud/GameOverCard'
import { Toast } from '../hud/Toast'

export function GameScreen() {
  const { lang, state, panel, summaryOpen, setPanel } = useStore()
  if (!state) return null
  const home = regionById(state.regions[0])
  return (
    <div className="screen game-screen">
      <Hud />
      <main className="game-main">
        {/* M3 replaces this placeholder with the Three.js diorama mount behind syncScene(state) */}
        <div className="diorama diorama-placeholder" onClick={() => setPanel(null)}>
          <span className="diorama-region">{lang === 'ka' ? home.nameKa : home.nameEn}</span>
          <span className="diorama-note">{t('dioramaSoon', lang)}</span>
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
