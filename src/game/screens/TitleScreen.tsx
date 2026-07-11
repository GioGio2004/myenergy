import { useStore } from '../../store'
import { t } from '../../engine/strings'
import hero from '../../assets/hero.png'

export function TitleScreen() {
  const { lang, hasSave, setLang, setScreen, continueGame } = useStore()
  return (
    <div className="screen title-screen">
      <img className="title-hero" src={hero} alt="" />
      <h1 className="title-logo">{t('appTitle', lang)}</h1>
      <p className="title-sub">{t('appSubtitle', lang)}</p>
      <p className="title-tagline">{t('tagline', lang)}</p>
      <div className="title-actions">
        <button className="btn btn-primary" onClick={() => setScreen('region')}>
          {t('play', lang)}
        </button>
        {hasSave && (
          <button className="btn" onClick={() => void continueGame()}>
            {t('continue', lang)}
          </button>
        )}
      </div>
      <button
        className="lang-toggle"
        onClick={() => setLang(lang === 'ka' ? 'en' : 'ka')}
      >
        {lang === 'ka' ? 'EN' : 'ქა'}
      </button>
    </div>
  )
}
