// Static stand-in for the real engine behind the three list-style analyses.
// Business suitability has its own richer builder in suitabilityReport.utils.ts.
// Everything here is mock data: no scoring model, no spatial query, no backend
// call. Results derive from the form input so a selection always shows the same
// numbers.
import {
  BUSINESS_CATEGORIES,
  INVESTMENT_SCALES,
  OPERATING_HOURS,
  SPACE_SIZES,
} from '@/views/(user)/map/constants'
import type {
  AnalysisResult,
  ChoiceOption,
  NearestSpacesInput,
  NearestSuppliersInput,
  TopBusinessesInput,
} from '@/views/(user)/map/types/smart-analysis.types'

function labelOf(options: ChoiceOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

/** Stable pseudo-score so a given selection always renders the same figure. */
function seededScore(seed: string, min: number, max: number): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000
  }
  return min + (hash % (max - min + 1))
}

function seededDistance(seed: string): number {
  return Number((seededScore(seed, 3, 42) / 10).toFixed(1))
}

export function buildTopBusinessesResult(
  input: TopBusinessesInput,
  pointCount: number,
): AnalysisResult {
  const scaleLabel = labelOf(INVESTMENT_SCALES, input.investmentScale)
  const seed = `${input.investmentScale}${input.operatingDays}${input.operatingHours}`

  const candidates = BUSINESS_CATEGORIES.map((category) => ({
    label: category.label,
    detail: category.description,
    score: seededScore(`${seed}${category.value}`, 52, 96),
  }))

  return {
    optionKey: 'top-businesses',
    title: 'Top 5 Best Businesses',
    summary: `Best fits for a ${scaleLabel.toLowerCase()} across a ${pointCount}-point area.`,
    scoreRows: candidates.sort((a, b) => b.score - a.score).slice(0, 5),
    placeRows: [],
    notes: [
      `Ranked for ${labelOf(OPERATING_HOURS, input.operatingHours)}.`,
      'Sample rankings only — the live suitability model is not connected yet.',
    ],
  }
}

const SUPPLIER_NAMES = [
  'Agusan Trading Supply',
  'Northern Mindanao Distributors',
  'Butuan Wholesale Depot',
  'Caraga Bulk Goods',
  'Nasipit Port Suppliers',
]

export function buildNearestSuppliersResult(input: NearestSuppliersInput): AnalysisResult {
  const categoryLabel = labelOf(BUSINESS_CATEGORIES, input.category)

  return {
    optionKey: 'nearest-suppliers',
    title: 'Nearest Suppliers',
    summary: `Suppliers serving ${categoryLabel.toLowerCase()} near the drawn area.`,
    scoreRows: [],
    placeRows: SUPPLIER_NAMES.map((name) => ({
      label: name,
      detail: `${categoryLabel} · wholesale and bulk orders`,
      distanceKm: seededDistance(`${input.category}${name}`),
    })).sort((a, b) => a.distanceKm - b.distanceKm),
    notes: ['Sample directory only — supplier records are not connected yet.'],
  }
}

const SPACE_NAMES = [
  'J.C. Aquino Avenue commercial unit',
  'Montilla Boulevard ground floor',
  'Villa Kananga roadside lot',
  'Libertad market-side stall row',
  'Doongan warehouse annex',
]

export function buildNearestSpacesResult(input: NearestSpacesInput): AnalysisResult {
  const sizeLabel = labelOf(SPACE_SIZES, input.spaceSize)
  const intentLabel = input.intent === 'sale' ? 'for sale' : 'for rent'

  return {
    optionKey: 'nearest-spaces',
    title: 'Nearest Spaces',
    summary: `${sizeLabel} spaces ${intentLabel} in or near the drawn area.`,
    scoreRows: [],
    placeRows: SPACE_NAMES.map((name) => ({
      label: name,
      detail: `${sizeLabel} · ${intentLabel}`,
      distanceKm: seededDistance(`${input.intent}${input.spaceSize}${name}`),
    })).sort((a, b) => a.distanceKm - b.distanceKm),
    notes: ['Sample listings only — property records are not connected yet.'],
  }
}
