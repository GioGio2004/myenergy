// ALL game numbers live here (docs/02-BALANCE-DATA.md becomes this file verbatim).
// Tune HERE only — never special-case the engine. M0 ships constants + regions;
// M1 adds buildables, seasons, events, contracts.

import type { RegionId } from './types'

export const START_MONEY = 10000
export const MAX_TURNS = 36
export const BASE_PRICE = 0.3 // GEL/kWh
export const WINTER_PRICE_MULT = 1.4
export const TRUST_DECAY = 2
export const CO2_PER_MWH = 0.4 // t avoided
export const GAS_COST_PER_MWH = 220 // GEL
export const GAS_CO2_PER_MWH = 0.45 // t emitted
export const BLACKOUT_TRUST_HIT = -8
export const BLACKOUT_PROSPERITY_HIT = -1
export const DEPENDENCE_STEP_UP = 6 // per quarter gas covers >20% of demand
export const DEPENDENCE_STEP_DOWN = 3 // per clean quarter

export interface RegionDef {
  id: RegionId
  nameKa: string
  nameEn: string
  sun: number
  wind: number
  water: number
  coast: boolean
  baseTrust: number
  demandStart: number // MWh/quarter
  quirkKa: string
  quirkEn: string
}

export const REGIONS: RegionDef[] = [
  { id: 'kakheti', nameKa: 'კახეთი', nameEn: 'Kakheti', sun: 9, wind: 4, water: 3, coast: false, baseTrust: 60, demandStart: 600, quirkKa: 'სეტყვის რისკი ×2', quirkEn: 'hail chance ×2' },
  { id: 'kartli', nameKa: 'ქართლი', nameEn: 'Kartli', sun: 6, wind: 9, water: 4, coast: false, baseTrust: 65, demandStart: 650, quirkKa: 'ქარი −10% ღირებულება (გორის პრეცედენტი)', quirkEn: 'wind −10% cost (Gori precedent)' },
  { id: 'javakheti', nameKa: 'სამცხე-ჯავახეთი', nameEn: 'Javakheti', sun: 7, wind: 8, water: 5, coast: false, baseTrust: 55, demandStart: 550, quirkKa: 'ზამთრის მოთხოვნა ×1.25 (მკაცრი)', quirkEn: 'winter demand ×1.25 (harsh)' },
  { id: 'imereti', nameKa: 'იმერეთი', nameEn: 'Imereti', sun: 5, wind: 4, water: 8, coast: false, baseTrust: 45, demandStart: 700, quirkKa: 'ჰესს +10 ნდობა სჭირდება (ნამახვანი)', quirkEn: 'hydro needs +10 trust (Namakhvani)' },
  { id: 'racha', nameKa: 'რაჭა', nameEn: 'Racha', sun: 4, wind: 3, water: 9, coast: false, baseTrust: 40, demandStart: 350, quirkKa: 'ჰესს +10 ნდობა; სათემო ქმედებები ×1.5', quirkEn: 'hydro +10 trust; community actions ×1.5' },
  { id: 'adjara', nameKa: 'აჭარა', nameEn: 'Adjara', sun: 4, wind: 5, water: 7, coast: true, baseTrust: 50, demandStart: 600, quirkKa: 'მზე −10%; კაბელის ნაპირი', quirkEn: 'solar −10%; cable landing' },
  { id: 'samegrelo', nameKa: 'სამეგრელო', nameEn: 'Samegrelo', sun: 3, wind: 5, water: 8, coast: true, baseTrust: 55, demandStart: 620, quirkKa: 'მზის ხაფანგი — ღრუბლიანი', quirkEn: 'the solar trap — cloudy' },
]

export function regionById(id: RegionId): RegionDef {
  return REGIONS.find((r) => r.id === id)!
}
