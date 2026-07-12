import { useStore } from '../../store'
import { t, pick } from '../../engine/strings'
import { SPONSORS, sponsorColorCss } from '../sponsors'

// Sponsor info card — opens when a billboard on the diorama rim is clicked
// (store.activeSponsor). Shows the partner's role, a one-line blurb, and an
// optional link to their site.
export function SponsorCard() {
  const { lang, activeSponsor, setActiveSponsor } = useStore()
  const sponsor = SPONSORS.find((s) => s.id === activeSponsor)
  if (!sponsor) return null
  const close = () => setActiveSponsor(null)
  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal="true">
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
        <button type="button" className="btn btn-ghost modal-btn" onClick={close}>
          {t('close', lang)}
        </button>
      </div>
    </div>
  )
}
