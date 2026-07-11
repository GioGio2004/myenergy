// ALL user-facing text lives here as {ka, en}. Georgian is the default and must
// be flawless. A hardcoded string in a component is a bug (dev rules §4.3, §8).

export type Lang = 'ka' | 'en'

type Entry = { ka: string; en: string }

const S = {
  appTitle: { ka: 'დენი', en: 'DENI' },
  appSubtitle: { ka: 'საქართველოს ენერგიის მეურვეები', en: 'Energy Stewards of Georgia' },
  tagline: {
    ka: '₾10,000, ერთი რეგიონი — და ქვეყანა, რომელიც ყოველ კუბურ მეტრ გაზს ყიდულობს.',
    en: '₾10,000, one region — and a country that imports every cubic meter of its gas.',
  },
  play: { ka: 'თამაში', en: 'Play' },
  continue: { ka: 'განაგრძე', en: 'Continue' },
  chooseRegion: { ka: 'აირჩიე რეგიონი', en: 'Choose your region' },
  back: { ka: 'უკან', en: 'Back' },
  turn: { ka: 'სვლა', en: 'Turn' },
  endTurn: { ka: 'სვლის დასრულება', en: 'End turn' },
  build: { ka: 'აშენება', en: 'Build' },
  trust: { ka: 'ნდობა', en: 'Trust' },
  market: { ka: 'ბაზარი', en: 'Market' },
  money: { ka: 'ფული', en: 'Money' },
  supply: { ka: 'მიწოდება', en: 'Supply' },
  demand: { ka: 'მოთხოვნა', en: 'Demand' },
  dependence: { ka: 'დამოკიდებულება', en: 'Dependence' },
  co2: { ka: 'CO₂ თავიდან აცილებული', en: 'CO₂ avoided' },
  act: { ka: 'აქტი', en: 'Act' },
  saved: { ka: 'შენახულია', en: 'Saved' },
  comingM1: { ka: 'იხსნება M1-ში', en: 'unlocks at M1' },
  dioramaSoon: { ka: 'დიორამა შენდება…', en: 'diorama under construction…' },
  springName: { ka: 'გაზაფხული', en: 'Spring' },
  summerName: { ka: 'ზაფხული', en: 'Summer' },
  autumnName: { ka: 'შემოდგომა', en: 'Autumn' },
  winterName: { ka: 'ზამთარი', en: 'Winter' },
  sun: { ka: 'მზე', en: 'Sun' },
  wind: { ka: 'ქარი', en: 'Wind' },
  water: { ka: 'წყალი', en: 'Water' },
  coast: { ka: 'ზღვა', en: 'Coast' },
} satisfies Record<string, Entry>

export type StringKey = keyof typeof S

export function t(key: StringKey, lang: Lang): string {
  return S[key][lang]
}
