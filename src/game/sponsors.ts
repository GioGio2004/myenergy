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
    blurb: {
      ka: 'ინდუსტრიული პარტნიორი — ცემენტის მწარმოებელი (კასპი).',
      en: 'Industry partner — cement producer (Kaspi).',
    },
  },
]

/** CSS hex for a sponsor accent color. */
export const sponsorColorCss = (color: number): string => `#${color.toString(16).padStart(6, '0')}`

/** Drop-in real-logo path; the board falls back to the styled name on 404. */
export const sponsorLogoUrl = (id: string): string => `${import.meta.env.BASE_URL || '/'}sponsors/${id}.png`
