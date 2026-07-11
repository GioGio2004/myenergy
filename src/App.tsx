import { useEffect } from 'react'
import { useStore } from './store'
import { TitleScreen } from './game/screens/TitleScreen'
import { RegionSelectScreen } from './game/screens/RegionSelectScreen'
import { GameScreen } from './game/screens/GameScreen'

// Screen router: title → region → game (+ resolution/event/act/win screens as
// milestones land). Plain switch — no router library needed for 9 screens.
export default function App() {
  const { booted, screen, boot } = useStore()

  useEffect(() => {
    void boot() // loads prefs + save presence; never mutates game state
  }, [boot])

  if (!booted) return <div className="screen boot-screen" />

  switch (screen) {
    case 'title':
      return <TitleScreen />
    case 'region':
      return <RegionSelectScreen />
    case 'game':
      return <GameScreen />
  }
}
