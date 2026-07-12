import { REGIONS, regionById } from '../../engine/data'
import { t, type Lang, type StringKey } from '../../engine/strings'
import type { RegionId } from '../../engine/types'
import { GEORGIA_VIEWBOX, REGION_GEOMETRY, CONTEXT_GEOMETRY } from './georgiaGeometry'
import { ResIcon } from '../ui/Icon'

// Split a (possibly long) region name into ≤2 balanced lines so labels never
// overlap their neighbours. Prefer a hyphen, then a space, near the middle.
function splitLabel(name: string): string[] {
  if (name.length <= 11) return [name]
  const hyphen = name.indexOf('-')
  if (hyphen > 0 && hyphen < name.length - 1) return [name.slice(0, hyphen + 1), name.slice(hyphen + 1).trim()]
  const mid = Math.floor(name.length / 2)
  let space = -1
  for (let d = 0; d < mid; d++) {
    if (name[mid - d] === ' ') { space = mid - d; break }
    if (name[mid + d] === ' ') { space = mid + d; break }
  }
  if (space > 0) return [name.slice(0, space), name.slice(space + 1)]
  return [name]
}

function MapLabel({ name, x, y, className }: { name: string; x: number; y: number; className: string }) {
  const lines = splitLabel(name)
  const long = name.length > 11
  return (
    <text className={`${className}${long ? ' is-long' : ''}`} x={x} y={y} textAnchor="middle">
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? (lines.length > 1 ? '-0.55em' : '0') : '1.1em'}>
          {line}
        </tspan>
      ))}
    </text>
  )
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
  const disabled = new Set(disabledRegions)

  const choose = (region: RegionId) => {
    if (!disabled.has(region)) onSelect(region)
  }

  return (
    <div className={`geo-map-shell${compact ? ' is-compact' : ''} ${className}`.trim()}>
      <svg
        className="geo-region-map"
        viewBox={GEORGIA_VIEWBOX}
        role="group"
        aria-label={t('regionMapAria', lang)}
      >
        <title>{t('regionMapAria', lang)}</title>
        <defs>
          <linearGradient id="geoLand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5c9b68" />
            <stop offset="1" stopColor="#3f7a4e" />
          </linearGradient>
          <linearGradient id="geoSel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd15c" />
            <stop offset="1" stopColor="#f2a63b" />
          </linearGradient>
          <linearGradient id="geoContext" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#40614b" />
            <stop offset="1" stopColor="#33503d" />
          </linearGradient>
          <filter id="geoShadow" x="-10%" y="-15%" width="120%" height="140%">
            <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="#06110b" floodOpacity=".5" />
          </filter>
        </defs>

        {/* Black Sea backdrop */}
        <rect className="geo-map-sea" x="0" y="0" width="1000" height="521" />
        <path className="geo-map-wave" d="M30 250 Q90 228 150 250 T270 250" />
        <path className="geo-map-wave geo-map-wave-two" d="M24 288 Q72 270 120 288 T216 288" />
        <text className="geo-sea-label" x="60" y="230">{t('mapBlackSea', lang)}</text>

        {/* Whole-country silhouette (drop shadow lifts Georgia off the sea) */}
        <g filter="url(#geoShadow)">
          {/* Context regions — full Georgian territory, not yet playable */}
          {CONTEXT_GEOMETRY.map((shape, i) => (
            <g className="geo-context" key={`ctx-${i}`} aria-hidden="true">
              <path className="geo-context-shape" d={shape.path} />
              <MapLabel className="geo-context-label" name={lang === 'ka' ? shape.nameKa : shape.nameEn} x={shape.labelX} y={shape.labelY} />
            </g>
          ))}

          {/* Playable regions */}
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
                  vectorEffect="non-scaling-stroke"
                />
                <MapLabel className="geo-region-label" name={name} x={shape.labelX} y={shape.labelY} />
                {isDisabled && (
                  <text className="geo-region-check" x={shape.labelX} y={shape.labelY + 32} textAnchor="middle" aria-hidden="true">
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

const RESOURCE_KEYS: ReadonlyArray<{ key: StringKey; res: 'sun' | 'wind' | 'water'; value: 'sun' | 'wind' | 'water' }> = [
  { key: 'sun', res: 'sun', value: 'sun' },
  { key: 'wind', res: 'wind', value: 'wind' },
  { key: 'water', res: 'water', value: 'water' },
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
        {region.coast && <span className="region-coast-badge"><ResIcon name="coast" /> {t('coast', lang)}</span>}
      </div>

      <div className="region-resource-list" aria-label={t('regionResourceFit', lang)}>
        {RESOURCE_KEYS.map((resource) => {
          const value = region[resource.value]
          return (
            <div className="region-resource-row" key={resource.key}>
              <span className="region-resource-name"><ResIcon name={resource.res} /> {t(resource.key, lang)}</span>
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
        <b><ResIcon name={strongest.res} /> {t(strongest.key, lang)}</b>
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
