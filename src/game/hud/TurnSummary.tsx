import { useStore } from '../../store'
import { EVENT_FACT, EVENT_TEXT, FACTS, pick, t } from '../../engine/strings'
import type { StringKey } from '../../engine/strings'
import { regionById } from '../../engine/data'
import type { Season } from '../../engine/types'

const SEASON_KEY: Record<Season, StringKey> = {
  spring: 'springName',
  summer: 'summerName',
  autumn: 'autumnName',
  winter: 'winterName',
}
const SEASON_ICON: Record<Season, string> = { spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️' }

function Row({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className={`sum-row ${cls ?? ''}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

export function TurnSummary() {
  const { lang, state, closeSummary } = useStore()
  if (!state?.lastReport) return null
  const r = state.lastReport
  const net = r.revenue - r.costs
  const ev = r.event ? EVENT_TEXT[r.event] : null
  // every event ends with a REAL fact (docs/01 §9); unpaired events rotate the list
  const fact = r.event ? FACTS[EVENT_FACT[r.event] ?? r.turn % FACTS.length] : null

  return (
    <div className="modal-backdrop" onClick={closeSummary}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          {SEASON_ICON[r.season]} {t(SEASON_KEY[r.season], lang)} · {t('turn', lang)} {r.turn} — {t('summaryTitle', lang)}
        </h3>

        {ev && (
          <div className="event-card">
            <span className="event-icon">{ev.icon}</span>
            <span>
              <b>{pick(ev.name, lang)}</b>
              <br />
              {pick(ev.desc, lang)}
            </span>
          </div>
        )}
        {fact && (
          <div className="fact-card">
            💡 <b>{t('factLabel', lang)}:</b> {pick(fact, lang)}
          </div>
        )}

        <div className="sum-grid">
          <Row label={`⚡ ${t('demand', lang)}`} value={`${r.demand.toLocaleString()} MWh`} />
          <Row
            label={`🌿 ${t('generatedLabel', lang)}`}
            value={`${r.generated.toLocaleString()} MWh`}
            cls={r.generated >= r.demand ? 'good' : ''}
          />
          {r.gasUsed > 0 && <Row label={`🔥 ${t('gasUsedLabel', lang)}`} value={`${r.gasUsed.toLocaleString()} MWh`} cls="warn" />}
          {r.fallbackUsed > 0 && (
            <Row label={`🛢 ${t('fallbackLabel', lang)}`} value={`${r.fallbackUsed.toLocaleString()} MWh`} cls="warn" />
          )}
          {r.importLevy > 0 && (
            <Row label={`🧾 ${t('importLevyLabel', lang)}`} value={`−₾${r.importLevy.toLocaleString()}`} cls="warn" />
          )}
          {r.exported > 0 && <Row label={`🚢 ${t('exportedLabel', lang)}`} value={`${r.exported.toLocaleString()} MWh`} />}
          {r.spotSold > 0 && <Row label={`💱 ${t('spotSoldLabel', lang)}`} value={`${r.spotSold.toLocaleString()} MWh`} />}
          {r.curtailed > 0 && <Row label={`🗑 ${t('curtailedLabel', lang)}`} value={`${r.curtailed.toLocaleString()} MWh`} cls="warn" />}
          <Row label={`💰 ${t('revenueLabel', lang)}`} value={`+₾${r.revenue.toLocaleString()}`} cls="good" />
          <Row label={`💸 ${t('costsLabel', lang)}`} value={`−₾${r.costs.toLocaleString()}`} cls="warn" />
          <Row
            label={`Σ ${t('netLabel', lang)}`}
            value={`${net >= 0 ? '+' : '−'}₾${Math.abs(net).toLocaleString()}`}
            cls={net >= 0 ? 'good net' : 'bad net'}
          />
        </div>

        {r.blackoutRegions.length > 0 && (
          <div className="blackout-banner">
            ⚫ {t('blackoutLabel', lang)}{' '}
            {r.blackoutRegions.map((id) => (lang === 'ka' ? regionById(id).nameKa : regionById(id).nameEn)).join(', ')}
          </div>
        )}
        {r.contractMissed && <div className="blackout-banner">📜 {t('contractMissedLabel', lang)}</div>}
        {r.unrestRegions.length > 0 && (
          <div className="blackout-banner">
            😠 {t('unrestLabel', lang)}{' '}
            {r.unrestRegions.map((id) => (lang === 'ka' ? regionById(id).nameKa : regionById(id).nameEn)).join(', ')}
          </div>
        )}

        {state.act === 1 && !state.gameOver && (
          <p className="panel-note center">
            {t('act', lang)} I · <b>{state.actProgress}/3</b> {t('coveredStreakLabel', lang)}
          </p>
        )}

        <button className="btn btn-primary modal-btn" onClick={closeSummary}>
          {t('continueLabel', lang)}
        </button>
      </div>
    </div>
  )
}
