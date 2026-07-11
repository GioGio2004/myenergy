import { useId } from 'react'
import { REGIONS, regionById } from '../../engine/data'
import { t, type Lang, type StringKey } from '../../engine/strings'
import type { RegionId } from '../../engine/types'

interface RegionGeometry {
  path: string
  labelX: number
  labelY: number
}

// A deliberately simplified, contiguous Georgia silhouette. The seven playable
// areas preserve their real west/east, mountain/coast relationships so the map
// teaches geography without pretending to be a cadastral boundary map.
const REGION_GEOMETRY: Record<RegionId, RegionGeometry> = {
  samegrelo: {
    path: 'M72 126 L128 90 L204 89 L231 135 L205 195 L152 233 L116 220 L85 187 Z',
    labelX: 151,
    labelY: 154,
  },
  racha: {
    path: 'M204 89 L267 61 L340 75 L365 116 L339 159 L280 163 L231 135 Z',
    labelX: 286,
    labelY: 111,
  },
  imereti: {
    path: 'M205 195 L231 135 L280 163 L339 159 L383 190 L358 242 L291 258 L229 244 L163 278 L152 233 Z',
    labelX: 279,
    labelY: 210,
  },
  adjara: {
    path: 'M54 279 L65 245 L116 220 L152 233 L163 278 L130 322 L82 311 Z',
    labelX: 108,
    labelY: 275,
  },
  kartli: {
    path: 'M339 159 L365 116 L444 102 L504 130 L526 181 L491 229 L417 253 L358 242 L383 190 Z',
    labelX: 432,
    labelY: 181,
  },
  javakheti: {
    path: 'M163 278 L229 244 L291 258 L358 242 L417 253 L404 309 L351 338 L277 329 L220 297 Z',
    labelX: 302,
    labelY: 292,
  },
  kakheti: {
    path: 'M504 130 L577 119 L632 142 L688 133 L714 169 L697 213 L728 243 L678 267 L623 254 L580 285 L525 260 L491 229 L526 181 Z',
    labelX: 613,
    labelY: 199,
  },
}

interface GeorgiaRegionMapProps {
  lang: Lang
  selected: RegionId | null
  onSelect: (region: RegionId) => void
  disabledRegions?: readonly RegionId[]
  compact?: boolean
  className?: string
}

export function GeorgiaRegionMap({
  lang,
  selected,
  onSelect,
  disabledRegions = [],
  compact = false,
  className = '',
}: GeorgiaRegionMapProps) {
  const patternId = `geo-disabled-${useId().replaceAll(':', '')}`
  const disabled = new Set(disabledRegions)

  const choose = (region: RegionId) => {
    if (!disabled.has(region)) onSelect(region)
  }

  return (
    <div className={`geo-map-shell${compact ? ' is-compact' : ''} ${className}`.trim()}>
      <svg
        className="geo-region-map"
        viewBox="0 0 780 390"
        role="group"
        aria-label={t('regionMapAria', lang)}
      >
        <title>{t('regionMapAria', lang)}</title>
        <defs>
          <linearGradient id={`${patternId}-sea`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#17354a" />
            <stop offset="1" stopColor="#28546a" />
          </linearGradient>
          <pattern id={patternId} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="9" height="9" fill="#323543" />
            <rect width="3" height="9" fill="#454452" />
          </pattern>
          <filter id={`${patternId}-shadow`} x="-20%" y="-25%" width="140%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#08070d" floodOpacity=".42" />
          </filter>
        </defs>

        <rect className="geo-map-sea" x="8" y="8" width="764" height="374" rx="28" fill={`url(#${patternId}-sea)`} />
        <path className="geo-map-wave" d="M22 214 Q62 197 101 214 T180 214" />
        <path className="geo-map-wave geo-map-wave-two" d="M18 239 Q50 225 82 239 T146 239" />
        <text className="geo-sea-label" x="40" y="188">{t('mapBlackSea', lang)}</text>

        <g className="geo-land-group" filter={`url(#${patternId}-shadow)`}>
          {REGIONS.map((region) => {
            const shape = REGION_GEOMETRY[region.id]
            const isDisabled = disabled.has(region.id)
            const isSelected = selected === region.id
            const name = lang === 'ka' ? region.nameKa : region.nameEn
            const accessibilityLabel = isDisabled
              ? `${name}. ${t('regionAlreadyChosen', lang)}`
              : `${name}. ${t('sun', lang)} ${region.sun}, ${t('wind', lang)} ${region.wind}, ${t('water', lang)} ${region.water}`

            return (
              <g
                key={region.id}
                className={`geo-region${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}`}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-label={accessibilityLabel}
                aria-pressed={isSelected}
                aria-disabled={isDisabled || undefined}
                onClick={() => choose(region.id)}
                onFocus={() => choose(region.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    choose(region.id)
                  }
                }}
              >
                <title>{accessibilityLabel}</title>
                <path
                  className="geo-region-shape"
                  d={shape.path}
                  style={isDisabled ? { fill: `url(#${patternId})` } : undefined}
                  vectorEffect="non-scaling-stroke"
                />
                <text className="geo-region-label" x={shape.labelX} y={shape.labelY} textAnchor="middle">
                  {name}
                </text>
                {isDisabled && (
                  <text className="geo-region-check" x={shape.labelX} y={shape.labelY + 22} textAnchor="middle" aria-hidden="true">
                    ✓
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      <p className="geo-map-hint">{t('regionMapHint', lang)}</p>
    </div>
  )
}

interface RegionResourcePreviewProps {
  lang: Lang
  regionId: RegionId
  compact?: boolean
}

const RESOURCE_KEYS: ReadonlyArray<{ key: StringKey; icon: string; value: 'sun' | 'wind' | 'water' }> = [
  { key: 'sun', icon: '☀️', value: 'sun' },
  { key: 'wind', icon: '💨', value: 'wind' },
  { key: 'water', icon: '🌊', value: 'water' },
]

export function RegionResourcePreview({ lang, regionId, compact = false }: RegionResourcePreviewProps) {
  const region = regionById(regionId)
  const name = lang === 'ka' ? region.nameKa : region.nameEn
  const quirk = lang === 'ka' ? region.quirkKa : region.quirkEn
  const strongest = RESOURCE_KEYS.reduce((best, resource) =>
    region[resource.value] > region[best.value] ? resource : best,
  )

  return (
    <article className={`region-resource-preview${compact ? ' is-compact' : ''}`} aria-live="polite">
      <div className="region-preview-heading">
        <div>
          <span className="region-preview-kicker">{t('regionSelectedLabel', lang)}</span>
          <h3>{name}</h3>
          {(regionId === 'kakheti' || regionId === 'kartli') && (
            <span className="region-recommended-badge">★ {t('recommendedRegion', lang)}</span>
          )}
        </div>
        {region.coast && <span className="region-coast-badge">🏖 {t('coast', lang)}</span>}
      </div>

      <div className="region-resource-list" aria-label={t('regionResourceFit', lang)}>
        {RESOURCE_KEYS.map((resource) => {
          const value = region[resource.value]
          return (
            <div className="region-resource-row" key={resource.key}>
              <span className="region-resource-name">{resource.icon} {t(resource.key, lang)}</span>
              <span className="region-resource-track" aria-hidden="true">
                <i style={{ width: `${value * 10}%` }} />
              </span>
              <b aria-label={`${value} / 10`}>{value}</b>
            </div>
          )
        })}
      </div>

      <p className="region-strongest">
        <span>{t('strongestResource', lang)}</span>
        <b>{strongest.icon} {t(strongest.key, lang)}</b>
      </p>

      {!compact && (
        <dl className="region-start-grid">
          <div>
            <dt>{t('startingTrustLabel', lang)}</dt>
            <dd>{region.baseTrust}/100</dd>
          </div>
          <div>
            <dt>{t('startingDemandLabel', lang)}</dt>
            <dd>{region.demandStart} MWh</dd>
          </div>
          <div>
            <dt>{t('availableSitesLabel', lang)}</dt>
            <dd>{region.slots.length}</dd>
          </div>
        </dl>
      )}

      <p className="region-challenge">
        <b>{t('regionChallengeLabel', lang)}:</b> {quirk}
      </p>
    </article>
  )
}
