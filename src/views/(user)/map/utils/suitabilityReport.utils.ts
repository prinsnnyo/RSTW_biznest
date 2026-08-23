// Static stand-in for the real suitability engine. Every figure below is mock
// data derived from the form selection with a seeded hash, so the same choices
// always produce the same report. No spatial query, no model, no backend.
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TYPES_BY_CATEGORY,
  INVESTMENT_SCALES,
  OPERATING_DAYS,
  OPERATING_HOURS,
} from '@/views/(user)/map/constants'
import type {
  AnalysisScoreRow,
  BusinessSuitabilityInput,
  ChoiceOption,
  FootTrafficBand,
  FootTrafficLevel,
  ReportBasisItem,
  SuitabilityReport,
  SuitabilityVerdict,
} from '@/types/smart-analysis.types'

const PESO = '₱'

function labelOf(options: ChoiceOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function descriptionOf(options: ChoiceOption[], value: string): string {
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

function verdictFor(score: number): SuitabilityVerdict {
  if (score >= 80) {
    return {
      score,
      label: 'Highly Suitable',
      tone: 'success',
      headline: 'Conditions in this area strongly favour the planned business.',
    }
  }

  if (score >= 60) {
    return {
      score,
      label: 'Moderately Suitable',
      tone: 'primary',
      headline: 'Based on foot traffic, CLUP zoning, competitors, POI, and capital alignment.',
    }
  }

  return {
    score,
    label: 'Low Suitability',
    tone: 'destructive',
    headline: 'Several factors work against this business type in the drawn area.',
  }
}

const TRAFFIC_WINDOWS = [
  'Early morning · 5:00 – 8:00 AM',
  'Morning · 8:00 – 11:00 AM',
  'Midday · 11:00 AM – 2:00 PM',
  'Afternoon · 2:00 – 5:00 PM',
  'Evening · 5:00 – 9:00 PM',
  'Late night · 9:00 PM – 1:00 AM',
]

/** Rough shape of a day's traffic per operating-hours preset, before seeding. */
const DEFAULT_TRAFFIC_SHAPE = [8, 24, 27, 24, 13, 4]

const TRAFFIC_SHAPES: Record<string, number[]> = {
  morning: [22, 30, 20, 13, 10, 5],
  business: [8, 24, 27, 24, 13, 4],
  extended: [9, 21, 24, 22, 19, 5],
  evening: [5, 11, 18, 24, 32, 10],
  nightlife: [3, 6, 10, 15, 33, 33],
  'late-night': [2, 5, 8, 12, 30, 43],
  'full-day': [10, 19, 22, 20, 21, 8],
  'always-open': [12, 18, 20, 19, 19, 12],
}

function levelForShare(share: number, peak: number): FootTrafficLevel {
  if (share === peak) {
    return 'Peak'
  }
  if (share >= 20) {
    return 'High'
  }
  return share >= 12 ? 'Moderate' : 'Low'
}

function buildFootTrafficBands(dailyTotal: number, operatingHours: string): FootTrafficBand[] {
  const shape = TRAFFIC_SHAPES[operatingHours] ?? DEFAULT_TRAFFIC_SHAPE
  const peak = Math.max(...shape)

  return TRAFFIC_WINDOWS.map((window, index) => {
    const share = shape[index] ?? 0
    const volume = Math.round((dailyTotal * share) / 100)

    return {
      window,
      share,
      level: levelForShare(share, peak),
      volume: `${volume.toLocaleString('en-PH')} passers`,
    }
  })
}

function buildScoreRows(seed: string, categoryLabel: string): AnalysisScoreRow[] {
  return [
    {
      label: 'Foot traffic',
      detail: 'Estimated daily passers within the drawn boundary (weight 20%)',
      score: seeded(`${seed}foot`, 48, 95),
    },
    {
      label: 'Competition density',
      detail: `Headroom left by existing ${categoryLabel.toLowerCase()} businesses (weight 18%)`,
      score: seeded(`${seed}competition`, 34, 88),
    },
    {
      label: 'CLUP zoning fit',
      detail: 'Alignment with the Butuan City land-use plan (weight 18%)',
      score: seeded(`${seed}zoning`, 55, 98),
    },
    {
      label: 'Accessibility',
      detail: 'Road hierarchy, parking and public-transport reach (weight 14%)',
      score: seeded(`${seed}access`, 50, 96),
    },
    {
      label: 'Purchasing power',
      detail: 'Household income against this price point (weight 12%)',
      score: seeded(`${seed}income`, 42, 92),
    },
    {
      label: 'Capital alignment',
      detail: 'Investment scale against local rent and fit-out costs (weight 10%)',
      score: seeded(`${seed}capital`, 45, 94),
    },
    {
      label: 'Hazard resilience',
      detail: 'Inverse of flood, fire and storm-surge exposure (weight 8%)',
      score: seeded(`${seed}hazard`, 38, 90),
    },
  ]
}

function buildBasis(
  seed: string,
  categoryLabel: string,
  typeLabel: string,
  dailyTotal: number,
  peakWindow: string,
): ReportBasisItem[] {
  const poiCount = seeded(`${seed}poi`, 3, 9)
  const directCompetitors = seeded(`${seed}direct`, 1, 6)
  const nearbySame = seeded(`${seed}same`, 2, 5)
  const chains = seeded(`${seed}chain`, 0, 3)
  const spaces = seeded(`${seed}space`, 1, 5)
  const rentLow = seeded(`${seed}rentlow`, 6, 14) * 1000
  const rentHigh = rentLow + seeded(`${seed}renthigh`, 6, 20) * 1000
  const floodLevels = ['low', 'low-to-moderate', 'moderate'] as const
  const floodLevel = floodLevels[seeded(`${seed}flood`, 0, 2)] ?? 'low'

  return [
    {
      icon: '📍',
      title: 'Points of Interest (POI)',
      body: `${poiCount} POI within 500 m. Schools, hospitals and public markets raise customer potential for ${typeLabel.toLowerCase()}.`,
      bullets: [
        `${seeded(`${seed}school`, 1, 4)} schools or campuses within 500 m`,
        `${seeded(`${seed}gov`, 1, 3)} government or barangay offices within 700 m`,
        `${seeded(`${seed}market`, 1, 2)} public market or transport terminal within 1 km`,
      ],
    },
    {
      icon: '🏪',
      title: 'Competitor Analysis',
      body: `${directCompetitors} direct competitors identified in the area. ${
        directCompetitors >= 4
          ? 'Competition is heavy — a clear differentiator is required.'
          : 'Competition is considerable — differentiation is recommended.'
      }`,
      bullets: [
        `Established local businesses in the same sector (${nearbySame} within 300 m)`,
        `National chain branches (${chains} within 500 m)`,
        'Online businesses serving the same area',
      ],
    },
    {
      icon: '🚶',
      title: 'Foot Traffic Estimate',
      body: `Estimated ${dailyTotal.toLocaleString('en-PH')} daily passers based on road type and proximity to commercial anchors.`,
      bullets: [
        `Peak window: ${peakWindow}`,
        `Weekend uplift of roughly ${seeded(`${seed}weekend`, 8, 35)}% over a weekday`,
        `Slowest window: ${TRAFFIC_WINDOWS[0] ?? 'early morning'}`,
      ],
    },
    {
      icon: '⚠️',
      title: 'Natural Hazard Assessment',
      body: `Area shows ${floodLevel} flood susceptibility. Infrastructure investment may be needed for ground-level establishments.`,
      bullets: [
        `Flood susceptibility: ${floodLevel}`,
        `Nearest fire station approximately ${(seeded(`${seed}fire`, 8, 34) / 10).toFixed(1)} km away`,
        'No active landslide-prone slope mapped inside the boundary',
      ],
    },
    {
      icon: '🗺️',
      title: 'CLUP — Land Use Plan',
      body: `Zone classification allows ${categoryLabel.toLowerCase()} operations. Butuan City CLUP 2020–2029 designates this area as Commercial Zone (C-1/C-2).`,
      bullets: [
        'Commercial Zone (C-1/C-2) under CLUP 2020–2029',
        'Business permit and locational clearance required before operating',
        'Setback and signage rules apply along the main road frontage',
      ],
    },
    {
      icon: '🏢',
      title: 'Available Spaces',
      body: `${spaces} commercial spaces available within 200 m ranging from ${peso(rentLow)}–${peso(rentHigh)} per month.`,
      bullets: [
        `Median asking rent: ${peso(Math.round((rentLow + rentHigh) / 2))} per month`,
        `Typical floor area: ${seeded(`${seed}sqm`, 18, 120)} sqm`,
        `Average vacancy on the strip: ${seeded(`${seed}vac`, 4, 18)}%`,
      ],
    },
    {
      icon: '📦',
      title: 'Nearby Suppliers',
      body: 'JC Trading and Butuan Public Market wholesalers are within 1.5 km — favourable for the supply chain.',
      bullets: [
        `${seeded(`${seed}supplier`, 2, 7)} wholesale suppliers within 2 km`,
        `Nearest bulk supplier approximately ${(seeded(`${seed}sdist`, 4, 18) / 10).toFixed(1)} km away`,
        'Port of Nasipit reachable within a 45-minute drive for bulk inbound freight',
      ],
    },
  ]
}

function buildRecommendations(seed: string, typeLabel: string, peakWindow: string): string[] {
  return [
    `Open through the ${peakWindow.toLowerCase()} window — that is where most passers fall.`,
    `Budget roughly ${peso(seeded(`${seed}fitout`, 80, 420) * 1000)} for fit-out and permits before first revenue.`,
    `Differentiate on service or price band; ${typeLabel.toLowerCase()} in this area competes mostly on convenience.`,
    'Secure a locational clearance early — CLUP compliance is checked before the business permit is released.',
    'Negotiate a rent-free fit-out period; vacancy on this strip gives some leverage.',
  ]
}

function buildRisks(seed: string, floodSeed: number): string[] {
  return [
    floodSeed > 1
      ? 'Ground-floor flooding during the September–January rains; raised flooring or flood gates advised.'
      : 'Minor street ponding during heavy rain; drainage at the frontage should be checked.',
    `Rent has moved roughly ${seeded(`${seed}rentgrowth`, 3, 14)}% year on year along this corridor.`,
    'Traffic rerouting on the main road during city road works can suppress walk-ins.',
    'Utility interruptions are common in the area; a backup power plan is recommended.',
  ]
}

export function buildSuitabilityReport(
  input: BusinessSuitabilityInput,
  areaSummary: string,
  generatedAt: string,
  id: string,
): SuitabilityReport {
  const categoryLabel = labelOf(BUSINESS_CATEGORIES, input.category)
  const typeLabel = labelOf(BUSINESS_TYPES_BY_CATEGORY[input.category] ?? [], input.businessType)
  const scaleLabel = labelOf(INVESTMENT_SCALES, input.investmentScale)
  const scaleRange =
    descriptionOf(INVESTMENT_SCALES, input.investmentScale).split(' · ')[0] ?? ''
  const daysLabel = descriptionOf(OPERATING_DAYS, input.operatingDays)
  const hoursLabel = descriptionOf(OPERATING_HOURS, input.operatingHours)

  const seed = `${input.category}${input.businessType}${input.investmentScale}${input.operatingDays}${input.operatingHours}`

  const scoreRows = buildScoreRows(seed, categoryLabel)
  const score = Math.round(scoreRows.reduce((total, row) => total + row.score, 0) / scoreRows.length)

  const dailyTotal = seeded(`${seed}daily`, 900, 4200)
  const bands = buildFootTrafficBands(dailyTotal, input.operatingHours)
  const fallbackBand: FootTrafficBand = {
    window: TRAFFIC_WINDOWS[0] ?? 'Morning',
    share: 0,
    level: 'Moderate',
    volume: '0 passers',
  }
  const peakBand = bands.find((band) => band.level === 'Peak') ?? bands[0] ?? fallbackBand
  const floodSeed = seeded(`${seed}flood`, 0, 2)

  const population = seeded(`${seed}pop`, 4200, 18500)
  const households = Math.round(population / 4.3)
  const medianIncome = seeded(`${seed}income`, 16, 42) * 1000
  const spendShare = seeded(`${seed}spend`, 18, 34)
  const monthlySpend = Math.round((medianIncome * spendShare) / 100)

  return {
    kind: 'business-suitability',
    id,
    generatedAt,
    areaSummary,
    verdict: verdictFor(score),
    disclaimer:
      'Prototype analysis using static Butuan City data. Conduct an actual site survey for field-validated results.',
    selection: [
      { label: 'Category', value: categoryLabel },
      { label: 'Business Type', value: typeLabel },
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
    ],
    demographics: [
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
        label: 'Population density',
        value: `${seeded(`${seed}density`, 1200, 6400).toLocaleString('en-PH')} / km²`,
        hint: 'barangay-level estimate',
      },
      {
        label: 'Median age',
        value: `${seeded(`${seed}age`, 23, 34)} years`,
        hint: 'working-age majority',
      },
      {
        label: 'Daytime population',
        value: (population + seeded(`${seed}day`, 800, 5200)).toLocaleString('en-PH'),
        hint: 'residents plus workers and students',
      },
    ],
    market: [
      {
        label: 'Median household income',
        value: `${peso(medianIncome)} / month`,
        hint: 'city-band estimate',
      },
      {
        label: 'Discretionary spend',
        value: `${spendShare}%`,
        hint: 'share of income beyond essentials',
      },
      {
        label: 'Purchasing power per household',
        value: `${peso(monthlySpend)} / month`,
        hint: 'addressable monthly spend',
      },
      {
        label: 'Estimated area spend pool',
        value: `${peso(Math.round((monthlySpend * households) / 1000) * 1000)} / month`,
        hint: 'across all categories',
      },
      {
        label: 'Capturable share',
        value: `${seeded(`${seed}capture`, 2, 9)}%`,
        hint: `realistic first-year share for ${typeLabel.toLowerCase()}`,
      },
    ],
    scoreRows,
    footTraffic: {
      dailyEstimate: `${(Math.round((dailyTotal * 0.85) / 100) * 100).toLocaleString('en-PH')}–${(
        Math.round((dailyTotal * 1.15) / 100) * 100
      ).toLocaleString('en-PH')}`,
      peakWindow: peakBand.window,
      note: `Traffic peaks at ${peakBand.window.toLowerCase()} with roughly ${peakBand.volume}. Align staffing and stock to that window.`,
      bands,
    },
    basis: buildBasis(seed, categoryLabel, typeLabel, dailyTotal, peakBand.window),
    recommendations: buildRecommendations(seed, typeLabel, peakBand.window),
    risks: buildRisks(seed, floodSeed),
  }
}
