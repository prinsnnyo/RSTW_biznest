import type { MapDrawPoint } from '@/types/zoning.types'

/** Which of the four analyses the user picked from the area panel. */
export type AnalysisOptionKey =
  | 'business-suitability'
  | 'top-businesses'
  | 'nearest-suppliers'
  | 'nearest-spaces'

/** Where the user is in the draw → choose → fill → results flow. */
export type SmartAnalysisStep =
  | 'idle'
  | 'drawing'
  | 'drawn'
  | 'choosing'
  | 'form'
  | 'results'
  | 'report'

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
  businessType: string
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


// ── Business suitability report ──────────────────────────────────────────────

/** A labelled figure in one of the report's fact panels. */
export interface ReportMetric {
  label: string
  value: string
  hint?: string
}

/** One "Analysis Basis" card: an icon, a finding, and its supporting points. */
export interface ReportBasisItem {
  icon: string
  title: string
  body: string
  bullets: string[]
}

export type FootTrafficLevel = 'Low' | 'Moderate' | 'High' | 'Peak'

export interface FootTrafficBand {
  window: string
  level: FootTrafficLevel
  volume: string
  /** Share of the day's total passers, 0-100. */
  share: number
}

export interface SuitabilityVerdict {
  score: number
  label: string
  tone: 'success' | 'primary' | 'destructive'
  headline: string
}

export interface SuitabilityReport {
  kind: 'business-suitability'
  id: string
  generatedAt: string
  areaSummary: string
  verdict: SuitabilityVerdict
  disclaimer: string
  selection: ReportMetric[]
  demographics: ReportMetric[]
  market: ReportMetric[]
  scoreRows: AnalysisScoreRow[]
  footTraffic: {
    dailyEstimate: string
    peakWindow: string
    note: string
    bands: FootTrafficBand[]
  }
  basis: ReportBasisItem[]
  recommendations: string[]
  risks: string[]
}


// ── Top 5 best businesses report ─────────────────────────────────────────────

export type DemandLevel = 'Very High' | 'High' | 'Moderate'
export type CompetitionLevel = 'Low' | 'Moderate' | 'Dense'

/** One expandable "full analysis" block under a ranked business. */
export interface OpportunityDetailSection {
  icon: string
  title: string
  bullets: string[]
  note: string
}

export interface BusinessOpportunity {
  rank: number
  name: string
  categoryLabel: string
  score: number
  rationale: string
  demand: DemandLevel
  competition: CompetitionLevel
  /** Headline economics, shown as chips on the collapsed card. */
  economics: ReportMetric[]
  sections: OpportunityDetailSection[]
}

export interface TopBusinessesReport {
  kind: 'top-businesses'
  id: string
  generatedAt: string
  areaSummary: string
  disclaimer: string
  criteria: ReportMetric[]
  areaProfile: ReportMetric[]
  methodology: AnalysisScoreRow[]
  opportunities: BusinessOpportunity[]
}

/** Anything the report archive can hold. */
export type SavedAnalysisReport = SuitabilityReport | TopBusinessesReport
