import { useStore } from '../../store'
import { t } from '../../engine/strings'

export function ActSplash() {
  const { lang, actSplash, closeActSplash } = useStore()
  if (!actSplash) return null
  return (
    <div className="modal-backdrop act-splash">
      <div className="modal-card gameover-card">
        <div className="act-splash-icon">{actSplash === 2 ? '🇬🇪' : '🇪🇺'}</div>
        <h2 className="modal-title">{t(actSplash === 2 ? 'act2Title' : 'act3Title', lang)}</h2>
        <p className="nmk-story">{t(actSplash === 2 ? 'act2Goal' : 'act3Goal', lang)}</p>
        <button className="btn btn-primary modal-btn" onClick={closeActSplash}>
          {t('actSplashGo', lang)}
        </button>
      </div>
    </div>
  )
}
