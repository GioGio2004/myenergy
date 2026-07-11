import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { regionById } from '../../engine/data'
import { Hud } from '../hud/Hud'
import { ActionBar } from '../hud/ActionBar'

export function GameScreen() {
  const { lang, state } = useStore()
  if (!state) return null
  const home = regionById(state.regions[0])
  return (
    <div className="screen game-screen">
      <Hud />
      {/* M3 replaces this placeholder with the Three.js diorama mount behind syncScene(state) */}
      <div className="diorama diorama-placeholder">
        <span className="diorama-region">{lang === 'ka' ? home.nameKa : home.nameEn}</span>
        <span className="diorama-note">{t('dioramaSoon', lang)}</span>
      </div>
      <ActionBar />
    </div>
  )
}
