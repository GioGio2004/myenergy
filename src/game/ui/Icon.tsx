// Inline SVG icon set — replaces emoji for a crisper, non-"cheap" look.
// All icons are self-contained (no external fonts/CDN) so they survive the
// offline PWA + strict asset story. currentColor lets CSS theme them.

import type { CSSProperties, ReactElement } from 'react'

export type IconName =
  | 'sun' | 'wind' | 'water' | 'coast'
  | 'money' | 'power' | 'people' | 'happy' | 'jobs' | 'clean'
  | 'trust' | 'leaf' | 'bolt' | 'factory' | 'battery'
  | 'check' | 'lock' | 'star' | 'warn' | 'info' | 'handshake' | 'map'
  | 'eye' | 'eyeOff' | 'home'

interface IconProps {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
  title?: string
}

// Each entry draws inside a 24x24 viewBox using stroke=currentColor.
const PATHS: Record<IconName, ReactElement> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" />
    </>
  ),
  wind: (
    <path d="M3 8h11a2.6 2.6 0 1 0-2.6-2.6M3 12h15a2.8 2.8 0 1 1-2.8 2.8M3 16h9.5a2.4 2.4 0 1 1-2.4 2.4" />
  ),
  water: (
    <path d="M12 3.2c3.4 4 5.6 6.8 5.6 9.6a5.6 5.6 0 1 1-11.2 0C6.4 10 8.6 7.2 12 3.2Z" />
  ),
  coast: (
    <>
      <circle cx="17" cy="7.5" r="2.6" />
      <path d="M3 15.5c1.6 0 1.6 1.5 3.2 1.5s1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5M3 19.5c1.6 0 1.6 1.5 3.2 1.5s1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5" />
    </>
  ),
  money: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M5.5 9v6M18.5 9v6" />
    </>
  ),
  power: (
    <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M15.5 5.6a3 3 0 0 1 0 5.6M16.8 14.8c2.2.6 3.9 2.6 3.9 5.2" />
    </>
  ),
  happy: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M8 10.5h.01M16 10.5h.01M8 14.5c1 1.4 2.4 2.1 4 2.1s3-.7 4-2.1" />
    </>
  ),
  jobs: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 12.5h18" />
    </>
  ),
  clean: (
    <>
      <path d="M12 3.5c-4 3.4-6 6.2-6 9.3a6 6 0 0 0 12 0c0-3.1-2-5.9-6-9.3Z" />
      <path d="M12 8.5c-1.8 1.7-2.7 3-2.7 4.6" />
    </>
  ),
  trust: (
    <path d="M12 21s-7.4-4.3-9.3-9.2C1.4 8.6 3 5.2 6.3 5.2c2 0 3.4 1.2 5.7 3.7 2.3-2.5 3.7-3.7 5.7-3.7 3.3 0 4.9 3.4 3.6 6.6C19.4 16.7 12 21 12 21Z" />
  ),
  leaf: (
    <path d="M4 20c0-9 6-15 16-15 0 10-6 16-15 16-.6-4 1-7 4-9" />
  ),
  bolt: (
    <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />
  ),
  factory: (
    <>
      <path d="M3 20V10l5 3.5V10l5 3.5V10l5 3.5V20Z" />
      <path d="M3 20h18" />
    </>
  ),
  battery: (
    <>
      <rect x="3" y="8" width="16" height="9" rx="1.6" />
      <path d="M21 11v3M8 12.5l-1.5 2.5h3l-1.5 2.5" />
    </>
  ),
  check: (<path d="M4.5 12.5 10 18 20 6" />),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  star: (
    <path d="M12 3.2 14.7 9l6.3.7-4.7 4.3 1.3 6.2L12 17.1 6.4 20.2l1.3-6.2L3 9.7 9.3 9Z" />
  ),
  warn: (
    <>
      <path d="M12 3.5 22 20H2Z" />
      <path d="M12 9.5v5M12 17.4h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 11v6M12 7.6h.01" />
    </>
  ),
  handshake: (
    <path d="M3 9.5 7 6l3.5 2.5L14 6l4 3.5v5l-4 3.5-3.5-2.5L7 18l-4-3.5Z" />
  ),
  map: (
    <>
      <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13l-5.5 2-6-2Z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 12s3.2-6.5 8-6.5c1.6 0 3 .5 4.2 1.2M20 12s-3.2 6.5-8 6.5c-1.5 0-2.9-.4-4.1-1.1" />
      <path d="M9.7 9.7a3.2 3.2 0 0 0 4.6 4.5" />
      <path d="M3.5 3.5 20.5 20.5" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.8 20v-5.4h4.4V20" />
    </>
  ),
}

// Solid-fill icons read better than stroke for these small glyphs.
const FILLED = new Set<IconName>(['power', 'bolt', 'star', 'trust'])

export function Icon({ name, size = 18, className = '', style, title }: IconProps) {
  const filled = FILLED.has(name)
  return (
    <svg
      className={`ui-icon ui-icon-${name} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={style}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  )
}

// Resource-flavored wrapper so the map/preview can color-code sun/wind/water.
export function ResIcon({ name }: { name: 'sun' | 'wind' | 'water' | 'coast' }) {
  return <Icon name={name} className={`res-icon res-${name}`} />
}
