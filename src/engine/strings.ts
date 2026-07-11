// ALL user-facing text lives here as {ka, en}. Georgian is the default and must
// be flawless. A hardcoded string in a component is a bug (dev rules §4.3, §8).

import type { BuildableId, EventId, TrustActionId } from './types'

export type Lang = 'ka' | 'en'

export type Entry = { ka: string; en: string }

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
  dioramaSoon: { ka: 'დიორამა შენდება…', en: 'diorama under construction…' },
  springName: { ka: 'გაზაფხული', en: 'Spring' },
  summerName: { ka: 'ზაფხული', en: 'Summer' },
  autumnName: { ka: 'შემოდგომა', en: 'Autumn' },
  winterName: { ka: 'ზამთარი', en: 'Winter' },
  sun: { ka: 'მზე', en: 'Sun' },
  wind: { ka: 'ქარი', en: 'Wind' },
  water: { ka: 'წყალი', en: 'Water' },
  coast: { ka: 'ზღვა', en: 'Coast' },

  // ---------- panels & rows ----------
  buildPanelTitle: { ka: 'რას ავაშენებთ?', en: 'What shall we build?' },
  trustPanelTitle: { ka: 'ნდობა თემში', en: 'Community trust' },
  marketPanelTitle: { ka: 'ბაზარი და ენერგია', en: 'Market & energy' },
  costLabel: { ka: 'ფასი', en: 'Cost' },
  upkeepLabel: { ka: 'მოვლა/კვ.', en: 'Upkeep/q' },
  outputLabel: { ka: 'გამომუშავება', en: 'Output' },
  storesLabel: { ka: 'ინახავს', en: 'Stores' },
  yourShare: { ka: 'შენი წილი', en: 'Your share' },
  chooseSlot: { ka: 'აირჩიე ადგილი', en: 'Choose a site' },
  occupied: { ka: 'დაკავებულია', en: 'occupied' },
  buildNow: { ka: 'აშენება', en: 'Build' },
  buildingLabel: { ka: 'შენდება…', en: 'building…' },
  builtLabel: { ka: 'აშენებულია', en: 'built' },
  mwhPerQuarter: { ka: 'MWh/კვ.', en: 'MWh/q' },
  youHave: { ka: 'გაქვს', en: 'you have' },
  needLabel: { ka: 'საჭიროა', en: 'needs' },
  trustDecayNote: { ka: 'ნდობა ყოველ კვარტალში −2-ით იკლებს — მოუარე.', en: 'Trust decays −2 every quarter — tend it.' },
  awarenessNote: {
    ka: 'ნდობა 80+ → +10% გამომუშავება („თემი უვლის თავისას“)',
    en: 'Trust 80+ → +10% output ("the community maintains what it owns")',
  },
  communityCount: { ka: 'სათემო ქმედებები (ჰესის კარიბჭე: 2)', en: 'Community actions (HPP gate: 2)' },
  eiaFlag: { ka: 'გზშ ჩატარებულია', en: 'EIA done' },

  // ---------- market ----------
  gasToggleTitle: { ka: 'გაზის პიკური სადგური', en: 'Gas peaker' },
  gasToggleOn: { ka: 'ჩართულია — დეფიციტს ავტომატურად ავსებს იმპორტული საწვავით', en: 'ON — fills deficits automatically with imported fuel' },
  gasToggleOff: { ka: 'გამორთულია — დეფიციტი ქსელს ან ჩაბნელებას რჩება', en: 'OFF — deficits fall to the grid, or the dark' },
  noPeakerNote: { ka: 'პიკური სადგური ჯერ არ გაქვს', en: 'you have no peaker yet' },
  surplusTitle: { ka: 'ჭარბი ენერგია', en: 'Surplus energy' },
  policyStore: { ka: 'შენახვა', en: 'Store' },
  policySell: { ka: 'გაყიდვა (სპოტი)', en: 'Sell (spot)' },
  sellNeedsLink: {
    ka: 'გაყიდვას გადამცემი ხაზი სჭირდება — უიმისოდ ჭარბი ენერგია იკარგება',
    en: 'Selling needs a transmission link — otherwise surplus is curtailed',
  },
  storeNeedsBattery: { ka: 'შესანახად საცავი სჭირდება — უიმისოდ ჭარბი იკარგება', en: 'Storing needs storage built — otherwise surplus is curtailed' },
  spotPriceLabel: { ka: 'თურქეთის სპოტ-ფასი', en: 'Turkey spot price' },
  storedLabel: { ka: 'შენახული ენერგია', en: 'Stored energy' },
  dependenceNote: {
    ka: 'იმპორტული გაზის წილი შენს ენერგიაში. კაბელს <40 სჭირდება.',
    en: 'Imported-gas share of your energy. The cable needs <40.',
  },
  contractsTitle: { ka: 'საექსპორტო კონტრაქტები', en: 'Export contracts' },
  signContract: { ka: 'ხელმოწერა', en: 'Sign' },
  contractActiveLabel: { ka: 'აქტიური კონტრაქტი', en: 'Active contract' },
  quartersLeftLabel: { ka: 'დარჩენილი კვარტალი', en: 'quarters left' },
  penaltyLabel: { ka: 'ჯარიმა/კვ.', en: 'Penalty/q' },
  volumeLabel: { ka: 'მოცულობა', en: 'Volume' },
  priceLabel: { ka: 'ფასი', en: 'Price' },
  customerArmenia: { ka: 'სომხეთი — მცირე და სტაბილური', en: 'Armenia — small and steady' },
  customerEu: { ka: 'ევროკავშირი (შავი ზღვის კაბელი) — პრიზი', en: 'EU (Black Sea cable) — the prize' },
  contractWarning: {
    ka: 'კონტრაქტი ჯერ ემსახურება, მერე — შენი სახლი. ზედმეტს ნუ დაჰპირდები.',
    en: 'The contract is served first, your home after. Don’t over-promise.',
  },

  // ---------- turn summary ----------
  summaryTitle: { ka: 'კვარტალის შედეგები', en: 'Quarter results' },
  generatedLabel: { ka: 'შენი გამომუშავება', en: 'Your generation' },
  gasUsedLabel: { ka: 'შენი გაზი (პიკური)', en: 'Your gas (peaker)' },
  fallbackLabel: { ka: 'ეროვნული ქსელი (იმპორტი)', en: 'National grid (imports)' },
  blackoutLabel: { ka: 'ჩაბნელება!', en: 'Blackout!' },
  exportedLabel: { ka: 'ექსპორტი (კონტრაქტი)', en: 'Exported (contract)' },
  spotSoldLabel: { ka: 'სპოტზე გაყიდული', en: 'Sold on spot' },
  curtailedLabel: { ka: 'დაკარგული ჭარბი', en: 'Curtailed surplus' },
  revenueLabel: { ka: 'შემოსავალი', en: 'Revenue' },
  costsLabel: { ka: 'ხარჯები', en: 'Costs' },
  netLabel: { ka: 'სუფთა შედეგი', en: 'Net' },
  contractMissedLabel: { ka: 'კონტრაქტი ჩაიშალა — ჯარიმა!', en: 'Contract missed — penalty!' },
  coveredStreakLabel: { ka: 'ზედიზედ დაფარული კვარტალი', en: 'covered quarters in a row' },
  eventLabel: { ka: 'მოვლენა', en: 'Event' },
  continueLabel: { ka: 'გაგრძელება', en: 'Continue' },

  // ---------- game over ----------
  victoryTitle: { ka: 'გამარჯვება!', en: 'Victory!' },
  defeatTitle: { ka: 'თამაში დასრულდა', en: 'Game over' },
  goEuContract: { ka: 'საქართველო ევროპის მწვანე ბატარეაა!', en: 'Georgia is Europe’s green battery!' },
  goBankrupt: { ka: 'გაკოტრდი — ფული გათავდა.', en: 'Bankrupt — the money ran out.' },
  goTrustZero: { ka: 'ხალხმა ნდობა საბოლოოდ დაკარგა.', en: 'The people lost their trust for good.' },
  goBlackouts: { ka: 'სამი ჩაბნელებული კვარტალი ზედიზედ.', en: 'Three blacked-out quarters in a row.' },
  goMaxTurns: { ka: 'ცხრა წელი გავიდა — აი, შენი კვალი.', en: 'Nine years passed — here is your legacy.' },
  scoreLabel: { ka: 'ქულა', en: 'Score' },
  gradeLabel: { ka: 'შეფასება', en: 'Grade' },
  restart: { ka: 'თავიდან თამაში', en: 'Play again' },
  toTitle: { ka: 'მთავარზე', en: 'Title screen' },

  // ---------- Namakhvani interstitial (M4 — the demo centerpiece) ----------
  nmkTitle: { ka: 'ნამახვანის გაკვეთილი', en: 'The Namakhvani lesson' },
  nmkStory: {
    ka: '2021 წელს საქართველოს ყველაზე დიდი დაგეგმილი ჰესი — ნამახვანი — ჩავარდა. თვეების პროტესტმა პროექტი გააჩერა, რადგან ხალხს არავინ ჰკითხა. ახლა შენი ჯერია: დიდი კაშხალი დიდ ფულს იძლევა — მაგრამ როგორ ააშენებ?',
    en: 'In 2021 Georgia’s biggest planned dam — Namakhvani — collapsed. Months of protests froze it, because nobody asked the people. Now it’s your turn: a big dam pays big — but how will you build it?',
  },
  nmkRush: { ka: 'აჩქარება — ბეტონი ახლავე', en: 'Rush it — concrete now' },
  nmkRushDesc: {
    ka: 'გვერდი აუარე თემს. 65% ალბათობით ხალხი გამოვა და კაპიტალის 30% დაიწვება.',
    en: 'Skip the community. 65% chance the people rise and 30% of the capital burns.',
  },
  nmkRight: { ka: 'სწორად გაკეთება', en: 'Do it right' },
  nmkRightDesc: {
    ka: 'ნდობა, გზშ და 2 სათემო ქმედება — და მშენებლობა მშვიდად დაიწყება.',
    en: 'Trust, an EIA and 2 community actions — and construction starts in peace.',
  },
  nmkProtest: {
    ka: 'ხალხი ქუჩაში გამოვიდა! მშენებლობა გაიყინა, კაპიტალის 30% დაიწვა, ნდობა ჩამოიშალა. ეს იყო ნამახვანი, 2021.',
    en: 'The people took to the streets! Construction frozen, 30% of the capital burned, trust cratered. This was Namakhvani, 2021.',
  },
  nmkStarted: {
    ka: 'მშენებლობა თემის მხარდაჭერით დაიწყო. ჰესი 2 კვარტალში ამუშავდება.',
    en: 'Construction began with the community behind it. The dam comes online in 2 quarters.',
  },
  nmkClose: { ka: 'გასაგებია', en: 'Understood' },

  // ---------- act splashes ----------
  act2Title: { ka: 'აქტი II — გაანათე საქართველო', en: 'Act II — Power Georgia' },
  act2Goal: {
    ka: 'შენი რეგიონი ანათებს! ახლა გააფართოვე: მეორე რეგიონი, გადამცემი ხაზი და საცავი (≥200 MWh). ორივე რეგიონი ≥90% საკუთარი ენერგიით.',
    en: 'Your region shines! Now expand: a second region, a transmission link and storage (≥200 MWh). Both regions ≥90% self-covered.',
  },
  act3Title: { ka: 'აქტი III — ევროპის მწვანე ბატარეა', en: 'Act III — Europe’s green battery' },
  act3Goal: {
    ka: 'დროა მსოფლიოსკენ: იყიდე შავი ზღვის კაბელის წილი (დამოკიდებულება <40) და შეასრულე ევროკავშირის 4-კვარტლიანი კონტრაქტი. ეს არის გამარჯვება.',
    en: 'Time to face the world: buy the Black Sea cable share (dependence <40) and fulfil the EU’s 4-quarter contract. That is victory.',
  },
  actSplashGo: { ka: 'წინ!', en: 'Onward!' },

  factLabel: { ka: 'ფაქტი', en: 'Fact' },
  soundLabel: { ka: 'ხმა', en: 'Sound' },
  nicknameLabel: { ka: 'შენი სახელი', en: 'Your name' },
  submitScore: { ka: 'ქულის შენახვა', en: 'Save score' },
  scoreSaved: { ka: 'ქულა შენახულია!', en: 'Score saved!' },

  // ---------- Act II/III UI (M5) ----------
  expandBanner: { ka: 'დაამატე მეორე რეგიონი', en: 'Add a second region' },
  expandTitle: { ka: 'აირჩიე მეორე რეგიონი', en: 'Choose your second region' },
  expandHint: {
    ka: 'გახსოვდეს: კაბელს სანაპირო რეგიონი სჭირდება (აჭარა ან სამეგრელო).',
    en: 'Remember: the cable needs a coastal region (Adjara or Samegrelo).',
  },
  worldMapBtn: { ka: 'ექსპორტის რუკა', en: 'Export map' },
  worldMapTitle: { ka: 'ენერგია მოძრაობს', en: 'Energy on the move' },
  mapGeorgia: { ka: 'საქართველო', en: 'Georgia' },
  mapTurkey: { ka: 'თურქეთი', en: 'Turkey' },
  mapArmenia: { ka: 'სომხეთი', en: 'Armenia' },
  mapEurope: { ka: 'ევროპა', en: 'Europe' },
  mapCableNote: {
    ka: 'შავი ზღვის კაბელი: 1155 კმ წყალქვეშ — საქართველოდან რუმინეთამდე.',
    en: 'The Black Sea cable: 1,155 km under the sea — Georgia to Romania.',
  },
  noExportsYet: { ka: 'ჯერ ექსპორტი არ გაქვს — ხაზები და კონტრაქტები ბაზარშია.', en: 'No exports yet — links and contracts live in the Market.' },

  // ---------- rejection reasons (dev rules §4.4) ----------
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
  rejEia: { ka: 'ჯერ გარემოს შეფასება (გზშ)', en: 'environmental assessment (EIA) first' },
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

export function pick(e: Entry, lang: Lang): string {
  return e[lang]
}

// ---------- buildables ----------
export const BUILDABLE_TEXT: Record<BuildableId, { name: Entry; desc: Entry; icon: string }> = {
  rooftop: {
    icon: '🏠',
    name: { ka: 'სახურავის მზის პანელი', en: 'Rooftop solar' },
    desc: { ka: 'პირველი ნაბიჯი — მზე შენს სახურავზე.', en: 'First step — sun on your own roof.' },
  },
  gig: {
    icon: '🧰',
    name: { ka: 'ენერგოაუდიტის საქმე', en: 'Energy-audit gig' },
    desc: { ka: 'დაეხმარე მეზობლებს: ₾4,500 შემდეგ სვლაზე.', en: 'Help the neighbours: ₾4,500 next turn.' },
  },
  commsolar: {
    icon: '☀️',
    name: { ka: 'სათემო მზის სადგური', en: 'Community solar' },
    desc: { ka: 'თემთან ერთად აშენებული — +3 ნდობა.', en: 'Built with the community — +3 trust.' },
  },
  turbine: {
    icon: '🌀',
    name: { ka: 'ქარის ტურბინა', en: 'Wind turbine' },
    desc: { ka: 'პირველი სერიოზული მანქანა ქარში.', en: 'Your first serious wind machine.' },
  },
  gaspeaker: {
    icon: '🔥',
    name: { ka: 'გაზის პიკური სადგური', en: 'Gas peaker' },
    desc: { ka: 'დეფიციტს ავტომატურად ავსებს — იმპორტული საწვავით. აცდუნებს.', en: 'Fills any deficit automatically — on imported fuel. Seductive.' },
  },
  solarfarm: {
    icon: '🌞',
    name: { ka: 'მზის ფერმა', en: 'Solar farm' },
    desc: { ka: 'დიდი მზე; ფიქსირებული PPA ფასი 0.28.', en: 'Big solar; fixed PPA price 0.28.' },
  },
  windfarm: {
    icon: '💨',
    name: { ka: 'ქარის ფერმა', en: 'Wind farm' },
    desc: { ka: 'სამრეწველო მასშტაბის ქარი.', en: 'Industrial-scale wind.' },
  },
  battery: {
    icon: '🔋',
    name: { ka: 'ბატარეა', en: 'Battery' },
    desc: { ka: 'ინახავს ჭარბს ღამისა და ზამთრისთვის.', en: 'Stores surplus for night and winter.' },
  },
  pumpedhydro: {
    icon: '⛰️',
    name: { ka: 'ჰიდროაკუმულაცია', en: 'Pumped hydro' },
    desc: { ka: 'საქართველოს რელიეფის სუპერძალა.', en: 'Georgia’s terrain superpower.' },
  },
  translink: {
    icon: '🗼',
    name: { ka: 'გადამცემი ხაზი', en: 'Transmission link' },
    desc: { ka: 'აკავშირებს რეგიონებს და ბაზრებს (დანაკარგი 8%).', en: 'Links regions and markets (8% loss).' },
  },
  hpp: {
    icon: '💧',
    name: { ka: 'ჰესი', en: 'Hydropower plant' },
    desc: { ka: 'ნამახვანის გაკვეთილი: ჯერ ნდობა, მერე ბეტონი.', en: 'The Namakhvani lesson: trust first, concrete later.' },
  },
  offshore: {
    icon: '🌊',
    name: { ka: 'ზღვის ქარის ფერმა', en: 'Offshore wind' },
    desc: { ka: 'შავი ზღვის ქარი — ძვირი, ზამთარში ძლიერი.', en: 'Black Sea wind — expensive, strong in winter.' },
  },
  cableshare: {
    icon: '🔌',
    name: { ka: 'შავი ზღვის კაბელის წილი', en: 'Black Sea cable share' },
    desc: { ka: 'წილი რეალურ პროექტში: $2.3 მლრდ, FID 2026.', en: 'A share of the real project: $2.3B, FID 2026.' },
  },
}

// ---------- trust actions ----------
export const TRUST_ACTION_TEXT: Record<TrustActionId, { name: Entry; desc: Entry; icon: string }> = {
  townhall: {
    icon: '🗣️',
    name: { ka: 'სოფლის კრება', en: 'Town hall' },
    desc: { ka: 'მოუსმინე ხალხს. +5 ნდობა.', en: 'Listen to the people. +5 trust.' },
  },
  school: {
    icon: '🏫',
    name: { ka: 'სკოლის პროგრამა', en: 'School program' },
    desc: { ka: 'ენერგიის გაკვეთილები ბავშვებს. +10 ნდობა.', en: 'Energy classes for the kids. +10 trust.' },
  },
  eia: {
    icon: '📋',
    name: { ka: 'გზშ — გარემოს შეფასება', en: 'EIA study' },
    desc: { ka: '+8 ნდობა და ჰესის კარიბჭის დროშა.', en: '+8 trust and the HPP gate flag.' },
  },
  hiring: {
    icon: '👷',
    name: { ka: 'ადგილობრივების დასაქმება', en: 'Local hiring' },
    desc: { ka: '+6 ნდობა; შემოსავალი −10% სამუდამოდ.', en: '+6 trust; revenue −10% ongoing.' },
  },
  revshare: {
    icon: '🤲',
    name: { ka: 'მოგების გაზიარება', en: 'Revenue share' },
    desc: { ka: '+12 ნდობა; შემოსავალი −15% სამუდამოდ.', en: '+12 trust; revenue −15% ongoing.' },
  },
}

// ---------- events ----------
export const EVENT_TEXT: Record<EventId, { name: Entry; desc: Entry; icon: string }> = {
  hail: {
    icon: '🌨️',
    name: { ka: 'სეტყვა', en: 'Hailstorm' },
    desc: { ka: 'მზის პანელები −50% ამ კვარტალში.', en: 'Solar output −50% this quarter.' },
  },
  drought: {
    icon: '🏜️',
    name: { ka: 'გვალვა', en: 'Drought' },
    desc: { ka: 'მდინარეები დაწიეს — ჰიდრო −40%.', en: 'Rivers ran low — hydro −40%.' },
  },
  elections: {
    icon: '🗳️',
    name: { ka: 'არჩევნები', en: 'Elections' },
    desc: { ka: 'პოპულიზმი დუღს — ნდობის კლება ×2, ორი კვარტალი.', en: 'Populism boils — trust decay ×2 for two quarters.' },
  },
  viral: {
    icon: '📱',
    name: { ka: 'ვირუსული ვიდეო', en: 'Viral video' },
    desc: { ka: 'შენი პროექტი TikTok-ზე მოხვდა — +8 ნდობა.', en: 'Your project went viral — +8 trust.' },
  },
  inspection: {
    icon: '🕵️',
    name: { ka: 'ინსპექცია', en: 'Inspection' },
    desc: { ka: 'მოულოდნელი შემოწმება — ფულის 5% ხარჯებში.', en: 'A surprise audit — 5% of your cash in costs.' },
  },
  coldsnapTR: {
    icon: '🥶',
    name: { ka: 'ყინვა თურქეთში', en: 'Cold snap in Turkey' },
    desc: { ka: 'სპოტ-ფასი ×2 — გაყიდი თუ შეინახავ?', en: 'Spot price ×2 — sell now or hold?' },
  },
  enguriLow: {
    icon: '🚱',
    name: { ka: 'ენგურის დაბალი დონე', en: 'Enguri reservoir low' },
    desc: { ka: 'ქვეყანაში დენი ცოტაა — ფასები ×1.3. (რეალური 2025 მოვლენა)', en: 'National supply is tight — prices ×1.3. (Real 2025 event)' },
  },
  gasspike: {
    icon: '📈',
    name: { ka: 'გაზის ფასის ნახტომი', en: 'Gas price spike' },
    desc: { ka: 'იმპორტული საწვავი ×1.8, ორი კვარტალი. გტკივა იმდენად, რამდენადაც დამოკიდებული ხარ.', en: 'Imported fuel ×1.8 for two quarters. It hurts exactly as much as you depend on it.' },
  },
  stormBS: {
    icon: '🌩️',
    name: { ka: 'შავი ზღვის შტორმი', en: 'Black Sea storm' },
    desc: { ka: 'ზღვის ტურბინები გაჩერდა ამ კვარტალში.', en: 'Offshore turbines are offline this quarter.' },
  },
  euGrantCable: {
    icon: '🇪🇺',
    name: { ka: 'ევროკავშირის გრანტი', en: 'EU grant' },
    desc: { ka: 'კაბელის წილი −30%, თუ საშუალო ნდობა ≥70.', en: 'Cable share −30% if average trust ≥70.' },
  },
  cloudsSamegrelo: {
    icon: '☁️',
    name: { ka: 'ღრუბლები სამეგრელოში', en: 'Clouds over Samegrelo' },
    desc: { ka: 'მზე −40% ამ კვარტალში. („გაფრთხილეთ.“)', en: 'Solar −40% this quarter. ("We told you.")' },
  },
  protest: {
    icon: '✊',
    name: { ka: 'საპროტესტო აქციები', en: 'Protests' },
    desc: { ka: 'ხალხი გამოვიდა — მშენებლობა გაჩერდა, კაპიტალის 30% დაიწვა.', en: 'The people rose — construction frozen, 30% of capital burned.' },
  },
}

// ---------- real fact cards (docs/01 §9-10: every event ends with a fact) ----------
export const FACTS: Entry[] = [
  { ka: 'საქართველო ელექტროენერგიის ~79%-ს ჰიდროსადგურებით გამოიმუშავებს.', en: 'Georgia generates ~79% of its electricity from hydropower.' },
  { ka: 'საქართველო ბუნებრივი გაზის ~100%-ს ყიდულობს — 84% აზერბაიჯანიდან.', en: 'Georgia imports ~100% of its natural gas — 84% from Azerbaijan.' },
  { ka: 'ყოველ ზამთარს საქართველო დენს ყიდულობს: მდინარეები იკლებს, მოთხოვნა იზრდება.', en: 'Every winter Georgia imports electricity: rivers run low while demand peaks.' },
  { ka: 'შავი ზღვის კაბელი: 1155 კმ, $2.3 მლრდ, საბოლოო გადაწყვეტილება — 2026 აპრილი, ამუშავება ~2029.', en: 'The Black Sea cable: 1,155 km, $2.3B, final investment decision April 2026, online ~2029.' },
  { ka: 'გორის ქარის სადგური (2016) საქართველოს პირველი ქარის ფერმაა — 20.7 MW.', en: 'Gori wind farm (2016) was Georgia’s first — 20.7 MW.' },
  { ka: 'ნამახვანი ჰესი (433 MW) 2021-ში თვეების პროტესტმა გააჩერა — თემს არავინ ჰკითხა.', en: 'Namakhvani HPP (433 MW) was stopped by months of protests in 2021 — the community was never asked.' },
  { ka: 'ენგურის კაშხალი მსოფლიოში ერთ-ერთი ყველაზე მაღალი თაღოვანი კაშხალია — 271.5 მ.', en: 'The Enguri dam is one of the world’s tallest arch dams — 271.5 m.' },
  { ka: 'ენგური საქართველოს გამომუშავების ~40%-ს იძლევა — ერთი კაშხალი.', en: 'Enguri alone provides ~40% of Georgia’s generation — a single dam.' },
  { ka: 'საქართველოს ჰიდროპოტენციალის მხოლოდ ~25%-ია ათვისებული.', en: 'Only ~25% of Georgia’s hydro potential is developed.' },
  { ka: 'მოთხოვნა ელექტროენერგიაზე საქართველოში წელიწადში ~3–4%-ით იზრდება.', en: 'Electricity demand in Georgia grows ~3–4% every year.' },
  { ka: 'საქართველო თურქეთს დენს უკვე ჰყიდის — ახალციხის 700 MW HVDC ხაზით.', en: 'Georgia already sells power to Turkey — via the 700 MW Akhaltsikhe HVDC link.' },
  { ka: 'ზამთრის დეფიციტს გარდაბნის გაზის სადგურები ფარავენ — იმპორტული საწვავით.', en: 'Georgia’s winter deficit is covered by the Gardabani gas plants — on imported fuel.' },
  { ka: 'ჰიდროაკუმულაცია საქართველოში ჯერ არ აშენებულა — რელიეფი კი იდეალურია.', en: 'No pumped-hydro storage has been built in Georgia yet — though the terrain is ideal.' },
  { ka: '2025 გაზაფხულზე ენგურის დაბალმა დონემ რეკორდული იმპორტი გამოიწვია.', en: 'In spring 2025 a low Enguri reservoir forced record electricity imports.' },
  { ka: 'კახეთი საქართველოს ყველაზე მზიანი კუთხეა — და სეტყვიანიც.', en: 'Kakheti is Georgia’s sunniest corner — and its most hail-prone.' },
  { ka: 'თამაშში დრო ~×3-ჯერ არის შეკუმშული — მაგრამ პროპორციები პატიოსანია.', en: 'Time in this game is compressed ~×3 — but the ratios are honest.' },
]

/** Event → most relevant fact index; events without a natural pair rotate by turn. */
export const EVENT_FACT: Partial<Record<EventId, number>> = {
  hail: 14,
  drought: 13,
  enguriLow: 7,
  gasspike: 1,
  coldsnapTR: 10,
  stormBS: 3,
  euGrantCable: 3,
  cloudsSamegrelo: 0,
  protest: 5,
  inspection: 9,
  elections: 8,
  viral: 4,
}
