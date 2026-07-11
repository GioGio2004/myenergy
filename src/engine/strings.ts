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
  // Rejection reasons — every disabled action shows WHY (dev rules §4.4)
  rejGameOver: { ka: 'თამაში დასრულდა', en: 'the game is over' },
  rejRegionLocked: { ka: 'რეგიონი ჯერ დაკეტილია', en: 'region not unlocked yet' },
  rejAct: { ka: 'შემდეგ აქტში იხსნება', en: 'unlocks in a later act' },
  rejMoney: { ka: 'არასაკმარისი თანხა', en: 'not enough money' },
  rejTrust: { ka: 'არასაკმარისი ნდობა', en: 'not enough trust' },
  rejWind: { ka: 'აქ ქარი სუსტია', en: 'wind is too weak here' },
  rejWater: { ka: 'აქ მდინარეები სუსტია', en: 'rivers are too weak here' },
  rejTrack: { ka: 'ჯერ გამოცდილება დააგროვე (MWh)', en: 'build your track record first (MWh)' },
  rejCoast: { ka: 'მხოლოდ სანაპირო რეგიონში', en: 'coastal regions only' },
  rejDependence: { ka: 'დამოკიდებულება ძალიან მაღალია (<40 საჭიროა)', en: 'dependence too high (<40 needed)' },
  rejNeedsFarm: { ka: 'ჯერ ელექტროსადგური ააშენე', en: 'build a power plant first' },
  rejMax: { ka: 'უკვე აშენებულია', en: 'already built' },
  rejNoSlot: { ka: 'თავისუფალი ადგილი არ არის', en: 'no free slot' },
  rejGigMax: { ka: 'მაქს. 2 საქმე სვლაზე', en: 'max 2 gigs per turn' },
  rejUseHppFlow: { ka: 'ჰესი ნამახვანის გზას გადის', en: 'HPP goes through the Namakhvani flow' },
  rejEia: { ka: 'ჯერ გარემოს შეფასება (EIA)', en: 'environmental assessment (EIA) first' },
  rejCommunity: { ka: '2 სათემო ქმედება სჭირდება', en: 'needs 2 community actions' },
  rejOnce: { ka: 'უკვე გაკეთებულია', en: 'already done' },
  rejContractActive: { ka: 'კონტრაქტი უკვე აქტიურია', en: 'a contract is already active' },
  rejNeedsTranslink: { ka: 'გადამცემი ხაზი სჭირდება', en: 'needs a transmission link' },
  rejNeedsCable: { ka: 'შავი ზღვის კაბელი სჭირდება', en: 'needs the Black Sea cable' },
} satisfies Record<string, Entry>

export type StringKey = keyof typeof S

export function t(key: StringKey, lang: Lang): string {
  return S[key][lang]
}
