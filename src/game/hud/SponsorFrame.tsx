import { useState } from 'react'
import { useStore } from '../../store'
import { t, pick } from '../../engine/strings'
import { SPONSORS, sponsorColorCss, sponsorLogoUrl, type Sponsor } from '../sponsors'

// Stadium-style perimeter board: a bottom-edge ribbon of clickable sponsor
// boards that frames the diorama without covering the play area. Boards show a
// real logo (public/sponsors/<id>.png) when present, else a clean styled name.
export function SponsorFrame() {
  const { lang } = useStore()
  const [active, setActive] = useState<Sponsor | null>(null)
  return (
    <>
      <div className="sponsor-frame" role="complementary" aria-label={t('partnersLabel', lang)}>
        <div className="sf-ribbon">
          {SPONSORS.map((s) => (
            <SponsorBoard key={s.id} sponsor={s} onOpen={() => setActive(s)} />
          ))}
        </div>
      </div>
      {active && <SponsorCard sponsor={active} lang={lang} onClose={() => setActive(null)} />}
    </>
  )
}

function SponsorBoard({ sponsor, onOpen }: { sponsor: Sponsor; onOpen: () => void }) {
  const [logoOk, setLogoOk] = useState(true)
  return (
    <button
      type="button"
      className={`sponsor-board${sponsor.light ? ' is-light' : ''}`}
      style={{ ['--chip' as string]: sponsorColorCss(sponsor.color) }}
      onClick={onOpen}
      title={sponsor.name}
    >
      {logoOk ? (
        <img
          className="sponsor-board-logo"
          src={sponsorLogoUrl(sponsor.id)}
          alt={sponsor.name}
          onError={() => setLogoOk(false)}
        />
      ) : (
        <span className="sponsor-board-name">{sponsor.name}</span>
      )}
      <span className="sponsor-board-kicker">MyEnerge partner</span>
    </button>
  )
}

function SponsorCard({ sponsor, lang, onClose }: { sponsor: Sponsor; lang: 'ka' | 'en'; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`modal-card sponsor-modal${sponsor.light ? ' is-light' : ''}`}
        style={{ ['--chip' as string]: sponsorColorCss(sponsor.color) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sponsor-modal-badge">{sponsor.name}</div>
        <span className="sponsor-modal-role">{pick(sponsor.role, lang)}</span>
        <p className="sponsor-modal-blurb">{pick(sponsor.blurb, lang)}</p>
        {sponsor.url && (
          <a className="btn btn-primary modal-btn" href={sponsor.url} target="_blank" rel="noopener noreferrer">
            {t('sponsorVisit', lang)} ↗
          </a>
        )}
        <button type="button" className="btn btn-ghost modal-btn" onClick={onClose}>
          {t('close', lang)}
        </button>
      </div>
    </div>
  )
}
