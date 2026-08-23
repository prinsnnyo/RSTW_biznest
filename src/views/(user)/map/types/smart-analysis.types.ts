import type { MapDrawPoint } from '@/types/zoning.types'

/** Which of the four analyses the user picked from the area panel. */
export type AnalysisOptionKey =
  | 'business-suitability'
  | 'top-businesses'
  | 'nearest-suppliers'
  | 'nearest-spaces'

/** Where the user is in the draw → choose → fill → results flow. */
export type SmartAnalysisStep = 'idle' | 'drawing' | 'drawn' | 'choosing' | 'form' | 'results'

/** One selectable card: a value, a heading and a supporting line. */
export interface ChoiceOption {
  value: string
  label: string
  description: string
}

export interface AnalysisOption {
  key: AnalysisOptionKey
  title: string
  description: string
}

export interface BusinessSuitabilityInput {
  category: string
  investmentScale: string
  operatingDays: string
  operatingHours: string
}

export interface TopBusinessesInput {
  investmentScale: string
  operatingDays: string
  operatingHours: string
}

export interface NearestSuppliersInput {
  category: string
}

export interface NearestSpacesInput {
  intent: string
  spaceSize: string
}

export type AnalysisInput =
  | BusinessSuitabilityInput
  | TopBusinessesInput
  | NearestSuppliersInput
  | NearestSpacesInput

/** A scored line item in a results list — score is 0-100. */
export interface AnalysisScoreRow {
  label: string
  detail: string
  score: number
}

/** A place found near the drawn area. */
export interface AnalysisPlaceRow {
  label: string
  detail: string
  distanceKm: number
}

export interface AnalysisResult {
  optionKey: AnalysisOptionKey
  title: string
  summary: string
  /** Headline 0-100 score. Omitted for the "find me places" analyses. */
  score?: number
  scoreRows: AnalysisScoreRow[]
  placeRows: AnalysisPlaceRow[]
  notes: string[]
}

export interface DrawnArea {
  points: MapDrawPoint[]
  locationLabel: string
}
