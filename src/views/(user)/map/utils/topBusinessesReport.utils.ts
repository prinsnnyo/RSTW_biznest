// Static stand-in for the ranking engine behind "Top 5 Best Businesses".
// Candidates come from the authored catalogue, scores are nudged by a seeded
// hash so a selection always ranks the same way. No model, no spatial query.
import {
  INVESTMENT_SCALES,
  OPERATING_DAYS,
  OPERATING_HOURS,
} from '@/views/(user)/map/constants'
import { BUSINESS_CATALOG, type CatalogEntry } from '@/views/(user)/map/utils/businessCatalog'
import type {
  AnalysisScoreRow,
  BusinessOpportunity,
  OpportunityDetailSection,
  ReportMetric,
  TopBusinessesInput,
  TopBusinessesReport,
} from '@/types/smart-analysis.types'

const PESO = '₱'
const TOP_COUNT = 5

interface Option {
  value: string
  label: string
  description: string
}

function labelOf(options: Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function descriptionOf(options: Option[], value: string): string {
  return options.find((option) => option.value === value)?.description ?? ''
}

/** Stable pseudo-random integer so a given selection always renders the same figure. */
function seeded(seed: string, min: number, max: number): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return min + (Math.abs(hash) % (max - min + 1))
}

function peso(value: number): string {
  return `${PESO}${value.toLocaleString('en-PH')}`
}

function clampScore(value: number): number {
  return Math.max(45, Math.min(98, value))
}

const FLOOD_LEVELS = ['Low', 'Low to moderate', 'Moderate'] as const

/**
 * Traffic phrasing per operating-hours preset — the same area reads differently
 * to a breakfast business and a nightlife one.
 */
const TRAFFIC_BY_HOURS: Record<string, string> = {
  morning: 'Peaks sharply between 6:00 and 9:00 AM as commuters and students pass through.',
  business: 'Steady through office hours with a pronounced 12:00 – 1:00 PM lunch spike.',
  extended: 'Broad plateau from mid-morning to early evening, with a second rise after 5:00 PM.',
  evening: 'Builds from 3:00 PM and peaks between 5:00 and 8:00 PM as workers head home.',
  nightlife: 'Thin during the day, concentrated between 7:00 PM and 1:00 AM on weekends.',
  'late-night': 'Almost entirely after 9:00 PM, driven by shift workers and weekend crowds.',
  'full-day': 'Two clear peaks — the 7:00 – 9:00 AM commute and the 5:00 – 7:00 PM return.',
  'always-open': 'Never fully drops; overnight volume runs roughly a fifth of the daytime peak.',
}

function buildSections(
  entry: CatalogEntry,
  seed: string,
  dailyLow: number,
  dailyHigh: number,
  trafficNote: string,
  floodLevel: string,
): OpportunityDetailSection[] {
  return [
    {
      icon: '📍',
      title: 'Points of Interest (POI)',
      bullets: entry.poi,
      note: 'These nearby establishments increase customer foot traffic and marketability for this business type.',
    },
    {
      icon: '🏪',
      title: 'Competitor Analysis',
      bullets: entry.competitors,
      note: entry.competitorNote,
    },
    {
      icon: '🚶',
      title: 'Foot Traffic Estimate',
      bullets: [
        `${entry.demand} — ${dailyLow.toLocaleString('en-PH')} – ${dailyHigh.toLocaleString('en-PH')} daily passers in the drawn area`,
        trafficNote,
        `Weekend uplift of roughly ${seeded(`${seed}weekend`, 8, 35)}% over a weekday`,
      ],
      note: 'Volumes are modelled from road hierarchy and proximity to commercial anchors.',
    },
    {
      icon: '⚠️',
      title: 'Natural Hazard Assessment',
      bullets: [
        `Flood susceptibility: ${floodLevel.toLowerCase()}`,
        `Nearest fire station approximately ${(seeded(`${seed}fire`, 8, 34) / 10).toFixed(1)} km away`,
        'No active landslide-prone slope mapped inside the boundary',
      ],
      note:
        floodLevel === 'Moderate'
          ? 'Raised flooring or flood gates are advised for ground-level operations.'
          : 'No critical flood path that would affect ground-level operations.',
    },
    {
      icon: '🗺️',
      title: 'CLUP — Land Use Plan',
      bullets: [
        'Commercial Zone (C-1/C-2) under Butuan City CLUP 2020–2029',
        `${entry.categoryLabel} operations are among the permitted uses in this zone`,
        'Business permit and locational clearance required before operating',
      ],
      note: 'Zoning permits this business type without a variance application.',
    },
    {
      icon: '🏢',
      title: 'Recommended Space Sizes',
      bullets: entry.spaceSizes,
      note: 'Based on standard requirements for this business type.',
    },
    {
      icon: '📦',
      title: 'Potential Suppliers',
      bullets: entry.suppliers,
      note: 'Verified supplier categories in Butuan City that can support this business.',
    },
  ]
}

function buildMethodology(seed: string): AnalysisScoreRow[] {
  return [
    {
      label: 'Demand signal',
      detail: 'Population, daytime population and category spend in the drawn area (weight 25%)',
      score: seeded(`${seed}demand`, 58, 96),
    },
    {
      label: 'Competitive headroom',
      detail: 'Unmet demand after accounting for existing operators (weight 20%)',
      score: seeded(`${seed}headroom`, 42, 92),
    },
    {
      label: 'Foot traffic alignment',
      detail: 'Overlap between passer peaks and the selected operating hours (weight 20%)',
      score: seeded(`${seed}align`, 50, 95),
    },
    {
      label: 'Capital fit',
      detail: 'Match between the selected investment scale and local cost base (weight 15%)',
      score: seeded(`${seed}capital`, 52, 94),
    },
    {
      label: 'CLUP & permitting',
      detail: 'Zoning permissiveness and licensing friction (weight 12%)',
      score: seeded(`${seed}clup`, 60, 98),
    },
    {
      label: 'Supply chain access',
      detail: 'Distance to wholesalers, cold chain and the Port of Nasipit (weight 8%)',
      score: seeded(`${seed}supply`, 48, 93),
    },
  ]
}

export function buildTopBusinessesReport(
  input: TopBusinessesInput,
  areaSummary: string,
  generatedAt: string,
  id: string,
): TopBusinessesReport {
  const scaleLabel = labelOf(INVESTMENT_SCALES, input.investmentScale)
  const scaleRange = descriptionOf(INVESTMENT_SCALES, input.investmentScale).split(' · ')[0] ?? ''
  const daysLabel = descriptionOf(OPERATING_DAYS, input.operatingDays)
  const hoursLabel = descriptionOf(OPERATING_HOURS, input.operatingHours)

  const seed = `${input.investmentScale}${input.operatingDays}${input.operatingHours}`
  const candidates = BUSINESS_CATALOG[input.investmentScale] ?? BUSINESS_CATALOG.micro ?? []

  const dailyTotal = seeded(`${seed}daily`, 900, 4200)
  const dailyLow = Math.round((dailyTotal * 0.85) / 100) * 100
  const dailyHigh = Math.round((dailyTotal * 1.15) / 100) * 100
  const trafficNote = TRAFFIC_BY_HOURS[input.operatingHours] ?? TRAFFIC_BY_HOURS.business ?? ''
  const floodLevel = FLOOD_LEVELS[seeded(`${seed}flood`, 0, 2)] ?? 'Low'

  const population = seeded(`${seed}pop`, 4200, 18500)
  const households = Math.round(population / 4.3)
  const medianIncome = seeded(`${seed}income`, 16, 42) * 1000
  const spendShare = seeded(`${seed}spend`, 18, 34)
  const monthlySpend = Math.round((medianIncome * spendShare) / 100)

  const opportunities: BusinessOpportunity[] = candidates
    .map((entry) => ({
      entry,
      score: clampScore(entry.baseScore + seeded(`${seed}${entry.name}`, -6, 4)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_COUNT)
    .map(({ entry, score }, index) => ({
      rank: index + 1,
      name: entry.name,
      categoryLabel: entry.categoryLabel,
      score,
      rationale: entry.rationale,
      demand: entry.demand,
      competition: entry.competition,
      economics: entry.economics,
      sections: buildSections(entry, `${seed}${entry.name}`, dailyLow, dailyHigh, trafficNote, floodLevel),
    }))

  const criteria: ReportMetric[] = [
    { label: 'Investment Scale', value: scaleLabel, hint: scaleRange },
    {
      label: 'Operating Days',
      value: labelOf(OPERATING_DAYS, input.operatingDays),
      hint: daysLabel,
    },
    {
      label: 'Operating Hours',
      value: labelOf(OPERATING_HOURS, input.operatingHours),
      hint: hoursLabel,
    },
    {
      label: 'Candidates screened',
      value: `${candidates.length} business types`,
      hint: `ranked down to the top ${TOP_COUNT}`,
    },
  ]

  const areaProfile: ReportMetric[] = [
    {
      label: 'Resident population',
      value: population.toLocaleString('en-PH'),
      hint: 'within the drawn boundary',
    },
    {
      label: 'Households',
      value: households.toLocaleString('en-PH'),
      hint: 'average 4.3 members per household',
    },
    {
      label: 'Daytime population',
      value: (population + seeded(`${seed}day`, 800, 5200)).toLocaleString('en-PH'),
      hint: 'residents plus workers and students',
    },
    {
      label: 'Daily foot traffic',
      value: `${dailyLow.toLocaleString('en-PH')} – ${dailyHigh.toLocaleString('en-PH')}`,
      hint: 'estimated passers in the area',
    },
    {
      label: 'Purchasing power per household',
      value: `${peso(monthlySpend)} / month`,
      hint: `${spendShare}% of median income beyond essentials`,
    },
    {
      label: 'Estimated area spend pool',
      value: `${peso(Math.round((monthlySpend * households) / 1000) * 1000)} / month`,
      hint: 'across all categories',
    },
  ]

  return {
    kind: 'top-businesses',
    id,
    generatedAt,
    areaSummary,
    disclaimer:
      'Prototype analysis using static Butuan City data. Rankings are based on area suitability factors, not guaranteed returns.',
    criteria,
    areaProfile,
    methodology: buildMethodology(seed),
    opportunities,
  }
}
