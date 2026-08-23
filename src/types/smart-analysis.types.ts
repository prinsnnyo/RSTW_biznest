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
  businessType: string
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
export type SavedAnalysisReport =
  | SuitabilityReport
  | TopBusinessesReport
  | NearestSuppliersReport
  | NearestSpacesReport


// ── Nearest suppliers report ─────────────────────────────────────────────────

/** One supplier in the static Butuan City directory. */
export interface SupplierRecord {
  name: string
  trade: string
  address: string
  barangay: string
  phone: string
  email: string
  lat: number
  lng: number
  specialties: string[]
  /** Business-type slugs this supplier serves especially well. */
  bestFor: string[]
  minimumOrder: string
  paymentTerms: string
  delivery: string
  leadTime: string
  operatingHours: string
  yearsOperating: number
}

export interface SupplierMatch {
  rank: number
  record: SupplierRecord
  /** Straight-line distance from the drawn area's centroid, in kilometres. */
  distanceKm: number
  matchScore: number
  matchReason: string
}

export interface NearestSuppliersReport {
  kind: 'nearest-suppliers'
  id: string
  generatedAt: string
  areaSummary: string
  disclaimer: string
  criteria: ReportMetric[]
  supplyProfile: ReportMetric[]
  suppliers: SupplierMatch[]
}


// ── Nearest space for rent / sale report ─────────────────────────────────────

export type SpaceIntent = 'rent' | 'sale'

/** A commercial property listing in the static Butuan City inventory. */
export interface SpaceListing {
  id: string
  name: string
  address: string
  barangay: string
  lat: number
  lng: number
  imageUrl?: string
  spaceType: string
  /** SPACE_SIZES values this building can accommodate. */
  sizeBands: string[]
  intents: SpaceIntent[]
  unitsAvailable: number
  areaSqmMin: number
  areaSqmMax: number
  rentMin?: number
  rentMax?: number
  salePriceMin?: number
  salePriceMax?: number
  rating?: number
  contactNumber?: string
  description: string
  amenities: string[]
  terms: ReportMetric[]
}

export interface SpaceListingMatch {
  rank: number
  listing: SpaceListing
  distanceKm: number
  matchScore: number
  matchReason: string
  /** Price for the requested intent, already formatted. */
  priceLabel: string
  /** Units in the requested size band. */
  unitsInBand: number
}

export interface NearestSpacesReport {
  kind: 'nearest-spaces'
  id: string
  generatedAt: string
  areaSummary: string
  disclaimer: string
  criteria: ReportMetric[]
  marketProfile: ReportMetric[]
  listings: SpaceListingMatch[]
}
