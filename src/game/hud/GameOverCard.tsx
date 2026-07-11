import { useState } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { saveRepo } from '../../services/saves'
import type { StringKey } from '../../engine/strings'
import type { GameOver } from '../../engine/types'

const REASON_KEY: Record<GameOver['reason'], StringKey> = {
  euContract: 'goEuContract',
  bankrupt: 'goBankrupt',
  trustZero: 'goTrustZero',
  blackouts: 'goBlackouts',
  maxTurns: 'goMaxTurns',
}

export function GameOverCard() {
  const { lang, state, setScreen } = useStore()
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const over = state?.gameOver
  if (!over || !state) return null
  const submit = () => {
    if (!name.trim() || saved) return
    saveRepo
      .submitScore({ name: name.trim(), score: over.score, region: state.regions[0], grade: over.grade })
      .catch(() => {})
    setSaved(true)
  }
  return (
    <div className="modal-backdrop">
      <div className="modal-card gameover-card">
        <h2 className="modal-title">{over.won ? `🏆 ${t('victoryTitle', lang)}` : `🌑 ${t('defeatTitle', lang)}`}</h2>
        <p className="gameover-reason">{t(REASON_KEY[over.reason], lang)}</p>
        <div className={`grade grade-${over.grade}`}>{over.grade}</div>
        <p className="panel-note center">
          {t('scoreLabel', lang)}: <b>{over.score.toLocaleString()}</b>
        </p>
        {saved ? (
          <p className="panel-note center">✅ {t('scoreSaved', lang)}</p>
        ) : (
          <div className="score-form">
            <input
              className="score-input"
              placeholder={t('nicknameLabel', lang)}
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn btn-small" disabled={!name.trim()} onClick={submit}>
              {t('submitScore', lang)}
            </button>
          </div>
        )}
        <button className="btn btn-primary modal-btn" onClick={() => setScreen('region')}>
          {t('restart', lang)}
        </button>
        <button className="btn modal-btn" onClick={() => setScreen('title')}>
          {t('toTitle', lang)}
        </button>
      </div>
    </div>
  )
}
