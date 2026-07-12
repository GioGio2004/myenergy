import { useState } from 'react'
import { useStore } from '../../store'
import { t } from '../../engine/strings'
import { saveRepo } from '../../services/saves'
import { MAX_TURNS } from '../../engine/data'
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
  const confettiColors = ['#f2a541', '#2f8fa8', '#77e38b', '#f5e7c8', '#c4552f', '#4dd0e1']
  return (
    <div className="modal-backdrop">
      <div className={`modal-card gameover-card${over.won ? ' gameover-won' : ''}`}>
        {over.won && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 44 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${(i * 2.27) % 100}%`,
                  background: confettiColors[i % confettiColors.length],
                  animationDelay: `${(i % 11) * 0.18}s`,
                  animationDuration: `${1.9 + (i % 5) * 0.35}s`,
                }}
              />
            ))}
          </div>
        )}
        <h2 className="modal-title">{over.won ? `🏆 ${t('victoryTitle', lang)}` : `🌑 ${t('defeatTitle', lang)}`}</h2>
        <p className="gameover-reason">{t(REASON_KEY[over.reason], lang)}</p>
        <div className={`grade grade-${over.grade}`}>{over.grade}</div>
        <p className="panel-note center">
          {t('scoreLabel', lang)}: <b>{over.score.toLocaleString()}</b>
        </p>
        <div className="sum-grid">
          <div className="sum-row">
            <span>{t('turn', lang)}</span>
            <b>{state.turn}/{MAX_TURNS}</b>
          </div>
          <div className="sum-row good">
            <span>{t('co2', lang)}</span>
            <b>{Math.round(state.co2Avoided).toLocaleString()} t</b>
          </div>
        </div>
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
