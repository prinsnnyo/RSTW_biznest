// Ranks the static supplier directory against the drawn area. Distances are
// genuinely computed from the polygon centroid; everything else — the records
// themselves, terms, contacts — is authored prototype data.
import { BUSINESS_CATEGORIES, BUSINESS_TYPES_BY_CATEGORY } from '@/views/(user)/map/constants'
import { SUPPLIER_DIRECTORY } from '@/views/(user)/map/utils/supplierDirectory'
import { centroidOf, haversineKm } from '@/views/(user)/map/utils/geo.utils'
import type { MapDrawPoint } from '@/types/zoning.types'
import type {
  NearestSuppliersInput,
  NearestSuppliersReport,
  ReportMetric,
  SupplierMatch,
  SupplierRecord,
} from '@/types/smart-analysis.types'

/** Distance beyond which a supplier stops scoring well for daily replenishment. */
const FAR_KM = 12

interface Option {
  value: string
  label: string
  description: string
}

function labelOf(options: Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

/**
 * Proximity carries most of the weight — a supplier you can reach twice a day
 * beats a marginally better-matched one across the city. A business-type match
 * and a long trading history top it up.
 */
function scoreSupplier(record: SupplierRecord, distanceKm: number, businessType: string): number {
  const proximity = Math.max(0, 1 - distanceKm / FAR_KM) * 62
  const typeMatch = record.bestFor.includes(businessType) ? 26 : 8
  const tenure = Math.min(12, record.yearsOperating / 2.5)

  return Math.round(Math.min(99, proximity + typeMatch + tenure))
}

function matchReasonFor(
  record: SupplierRecord,
  distanceKm: number,
  businessType: string,
  typeLabel: string,
): string {
  const servesType = record.bestFor.includes(businessType)

  if (servesType && distanceKm <= 3) {
    return `Stocks lines specific to ${typeLabel.toLowerCase()} and sits close enough for daily replenishment.`
  }

  if (servesType) {
    return `Stocks lines specific to ${typeLabel.toLowerCase()}; plan around scheduled deliveries at this distance.`
  }

  if (distanceKm <= 3) {
    return 'Close enough for same-day pickup, though its range is broader than this business type needs.'
  }

  return 'Carries adjacent categories — useful as a secondary or fallback source.'
}

function buildSupplyProfile(matches: SupplierMatch[], leadFallback: string): ReportMetric[] {
  if (matches.length === 0) {
    return []
  }

  const distances = matches.map((match) => match.distanceKm)
  const nearest = Math.min(...distances)
  const average = distances.reduce((total, value) => total + value, 0) / distances.length
  const withinFive = matches.filter((match) => match.distanceKm <= 5).length
  const withDelivery = matches.filter((match) =>
    match.record.delivery.toLowerCase().includes('free'),
  ).length
  const withTerms = matches.filter((match) =>
    match.record.paymentTerms.toLowerCase().includes('term'),
  ).length

  return [
    {
      label: 'Nearest supplier',
      value: `${nearest.toFixed(1)} km`,
      hint: 'straight-line from the area centroid',
    },
    {
      label: 'Average distance',
      value: `${average.toFixed(1)} km`,
      hint: `across ${matches.length} matches`,
    },
    {
      label: 'Within 5 km',
      value: `${withinFive} of ${matches.length}`,
      hint: 'reachable for same-day pickup',
    },
    {
      label: 'Offer free delivery',
      value: `${withDelivery} of ${matches.length}`,
      hint: 'within their stated radius',
    },
    {
      label: 'Offer credit terms',
      value: `${withTerms} of ${matches.length}`,
      hint: 'subject to accreditation',
    },
    {
      label: 'Typical lead time',
      value: leadFallback,
      hint: 'for the top-ranked supplier',
    },
  ]
}

export function buildNearestSuppliersReport(
  input: NearestSuppliersInput,
  points: MapDrawPoint[],
  areaSummary: string,
  generatedAt: string,
  id: string,
): NearestSuppliersReport {
  const categoryLabel = labelOf(BUSINESS_CATEGORIES, input.category)
  const typeLabel = labelOf(BUSINESS_TYPES_BY_CATEGORY[input.category] ?? [], input.businessType)

  const centroid = centroidOf(points)
  const records = SUPPLIER_DIRECTORY[input.category] ?? []

  const suppliers: SupplierMatch[] = records
    .map((record) => {
      const distanceKm = haversineKm(centroid, { lat: record.lat, lng: record.lng })

      return {
        record,
        distanceKm: Number(distanceKm.toFixed(1)),
        matchScore: scoreSupplier(record, distanceKm, input.businessType),
        matchReason: matchReasonFor(record, distanceKm, input.businessType, typeLabel),
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((match, index) => ({ ...match, rank: index + 1 }))

  const criteria: ReportMetric[] = [
    { label: 'Business Category', value: categoryLabel },
    { label: 'Business Type', value: typeLabel },
    {
      label: 'Search origin',
      value: `${centroid.lat.toFixed(4)}, ${centroid.lng.toFixed(4)}`,
      hint: 'centroid of the drawn area',
    },
    {
      label: 'Suppliers matched',
      value: `${suppliers.length}`,
      hint: 'ranked by proximity and category fit',
    },
  ]

  return {
    kind: 'nearest-suppliers',
    id,
    generatedAt,
    areaSummary,
    disclaimer:
      'Prototype — static supplier data for Butuan City. Contacts and terms are illustrative; field verification recommended before committing to any supplier.',
    criteria,
    supplyProfile: buildSupplyProfile(suppliers, suppliers[0]?.record.leadTime ?? '—'),
    suppliers,
  }
}
