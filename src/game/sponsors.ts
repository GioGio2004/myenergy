// Sponsor registry — the MONETIZATION surface. Rendered as a stadium-style
// perimeter "LED board" ribbon on the edge of the game (DOM overlay, not in the
// 3D scene, so it never steals attention from the diorama). Each board is
// clickable → a sponsor info card with an optional website link.
//
// `color` is the board's brand accent. Drop a real logo at
// public/sponsors/<id>.png and the board shows it instead of the styled name.

export type Bi = { ka: string; en: string }

export interface Sponsor {
  id: string
  name: string
  color: number // brand accent (0xRRGGBB)
  light?: boolean // dark ink on a light board
  role: Bi
  blurb: Bi
  url?: string // official site — omitted where we can't verify one
  logo?: string // real logo file in public/sponsors/ (exact name); else styled plaque
  logoCrop?: [number, number, number, number] // fractional [x,y,w,h] source crop of the logo
}

const ORGANISER: Bi = { ka: 'ორგანიზატორი', en: 'Organiser' }
const HOST: Bi = { ka: 'მასპინძელი', en: 'Host venue' }
const PARTNER: Bi = { ka: 'პარტნიორი', en: 'Partner' }

export const SPONSORS: Sponsor[] = [
  {
    id: 'gita',
    name: 'GITA',
    color: 0xf2a541,
    light: true,
    role: ORGANISER,
    url: 'https://gita.gov.ge',
    logo: 'gita.png',
    logoCrop: [0, 0, 0.22, 1], // isolate the colored hexagon mark (wordmark is white → invisible on the card)
    blurb: {
      ka: 'საქართველოს ინოვაციების და ტექნოლოგიების სააგენტო — EnergoHack-ის ორგანიზატორი.',
      en: "Georgia's Innovation & Technology Agency — EnergoHack organiser.",
    },
  },
  {
    id: 'technopark',
    name: 'TECHNOPARK',
    color: 0x6a4c93,
    role: HOST,
    logo: 'techno_park.png',
    blurb: {
      ka: 'კასპის ტექნოპარკი — EnergoHack-ის მასპინძელი სივრცე.',
      en: 'Kaspi Technopark — the EnergoHack venue.',
    },
  },
  {
    id: 'socar',
    name: 'SOCAR',
    color: 0x00a9c7,
    role: PARTNER,
    url: 'https://www.socar.ge',
    logo: 'SOCAR_logo.jpg',
    blurb: {
      ka: 'ბუნებრივი გაზისა და საწვავის ენერგოკომპანია.',
      en: "Georgia's natural-gas & fuel energy company.",
    },
  },
  {
    id: 'greda',
    name: 'GREDA',
    color: 0x2f9e4f,
    role: PARTNER,
    url: 'https://greda.ge',
    logo: 'greda_logo.png',
    blurb: {
      ka: 'საქართველოს განახლებადი ენერგიის განვითარების ასოციაცია.',
      en: 'Georgian Renewable Energy Development Association.',
    },
  },
  {
    id: 'grpo',
    name: 'GEORGIAN RENEWABLE POWER',
    color: 0x1f8f74,
    role: PARTNER,
    logo: 'georgian_renewable_power_logo.jpg',
    blurb: {
      ka: 'განახლებადი ენერგიის მწარმოებელი ოპერატორი.',
      en: 'Renewable-power generation operator.',
    },
  },
  {
    id: 'vdc',
    name: 'VDC ENERGY',
    color: 0x2f6fa8,
    role: PARTNER,
    logo: 'vdc_logo.png',
    blurb: {
      ka: 'MyEnerge-ის ენერგოსექტორის პარტნიორი.',
      en: 'Energy-sector partner of MyEnerge.',
    },
  },
  {
    id: 'hunnewell',
    name: 'HUNNEWELL CEMENT',
    color: 0xb0752a,
    role: PARTNER,
    logo: 'hunnewellcement_logo.jpg',
    blurb: {
      ka: 'ინდუსტრიული პარტნიორი — ცემენტის მწარმოებელი (კასპი).',
      en: 'Industry partner — cement producer (Kaspi).',
    },
  },
]

/** CSS hex for a sponsor accent color. */
export const sponsorColorCss = (color: number): string => `#${color.toString(16).padStart(6, '0')}`

/** Real-logo URL for a sponsor, or null when no asset is supplied (→ styled plaque). */
export const sponsorLogoUrl = (s: Sponsor): string | null =>
  s.logo ? `${import.meta.env.BASE_URL || '/'}sponsors/${s.logo}` : null
