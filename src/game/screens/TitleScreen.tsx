import { useStore } from '../../store'
import { t } from '../../engine/strings'
import hero from '../../assets/hero.png'

export function TitleScreen() {
  const { lang, hasSave, setLang, setScreen, continueGame, startDemo } = useStore()
  return (
    <div className="screen title-screen">
      <img className="title-hero" src={hero} alt="" />
      <h1 className="title-logo">{t('appTitle', lang)}</h1>
      <p className="title-sub">{t('appSubtitle', lang)}</p>
      <p className="title-tagline">{t('tagline', lang)}</p>
      <ol className="title-howto" aria-label={t('howToWinTitle', lang)}>
        <li><span className="howto-step">1</span> {t('howToWin1', lang)}</li>
        <li><span className="howto-step">2</span> {t('howToWin2', lang)}</li>
        <li><span className="howto-step">3</span> {t('howToWin3', lang)}</li>
      </ol>
      <div className="title-actions">
        <button className="btn btn-primary" onClick={() => setScreen('region')}>
          {t('play', lang)}
        </button>
        {hasSave && (
          <button className="btn" onClick={() => void continueGame()}>
            {t('continue', lang)}
          </button>
        )}
        <button className="btn btn-ghost btn-small title-demo-btn" onClick={() => startDemo(2)}>
          ▶ {t('demoJump', lang)}
        </button>
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
