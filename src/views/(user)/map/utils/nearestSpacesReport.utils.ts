// Ranks the static space inventory against the drawn area. Distances are
// genuinely computed from the polygon centroid; listings, prices and terms are
// static data (the first three buildings mirror the chatbot's real records).
import { SPACE_INTENTS, SPACE_SIZES } from '@/views/(user)/map/constants'
import { centroidOf, haversineKm } from '@/views/(user)/map/utils/geo.utils'
import { SPACE_INVENTORY } from '@/views/(user)/map/utils/spaceInventory'
import type { MapDrawPoint } from '@/types/zoning.types'
import type {
  NearestSpacesInput,
  NearestSpacesReport,
  ReportMetric,
  SpaceIntent,
  SpaceListing,
  SpaceListingMatch,
} from '@/views/(user)/map/types/smart-analysis.types'

const PESO = '₱'
/** Distance beyond which a listing stops being a practical option for the area. */
const FAR_KM = 10

interface Option {
  value: string
  label: string
  description: string
}

function labelOf(options: Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function peso(value: number): string {
  return `${PESO}${value.toLocaleString('en-PH')}`
}

function millions(value: number): string {
  return `${PESO}${(value / 1_000_000).toFixed(1)}M`
}

function priceLabelFor(listing: SpaceListing, intent: SpaceIntent): string {
  if (intent === 'sale') {
    if (listing.salePriceMin === undefined || listing.salePriceMax === undefined) {
      return 'Price on request'
    }

    return listing.salePriceMin === listing.salePriceMax
      ? millions(listing.salePriceMin)
      : `${millions(listing.salePriceMin)} – ${millions(listing.salePriceMax)}`
  }

  if (listing.rentMin === undefined || listing.rentMax === undefined) {
    return 'Rent on request'
  }

  return `${peso(listing.rentMin)} – ${peso(listing.rentMax)} / mo`
}

/**
 * Proximity dominates — a space outside the drawn catchment defeats the point of
 * drawing one. An exact size-band match and available inventory top it up.
 */
function scoreListing(
  listing: SpaceListing,
  distanceKm: number,
  sizeBand: string,
  intent: SpaceIntent,
): number {
  const proximity = Math.max(0, 1 - distanceKm / FAR_KM) * 58
  const sizeMatch = listing.sizeBands.includes(sizeBand) ? 24 : 6
  const intentMatch = listing.intents.includes(intent) ? 12 : 0
  const inventory = Math.min(8, listing.unitsAvailable)

  return Math.round(Math.min(99, proximity + sizeMatch + intentMatch + inventory))
}

function matchReasonFor(
  listing: SpaceListing,
  distanceKm: number,
  sizeBand: string,
  sizeLabel: string,
  intent: SpaceIntent,
): string {
  const fitsSize = listing.sizeBands.includes(sizeBand)
  const intentWord = intent === 'sale' ? 'for sale' : 'for lease'

  if (fitsSize && distanceKm <= 1.5) {
    return `Inside the drawn area with ${sizeLabel.toLowerCase()} units ${intentWord} right now.`
  }

  if (fitsSize) {
    return `Carries ${sizeLabel.toLowerCase()} units ${intentWord}, a short trip from the boundary.`
  }

  const nearestBand = listing.areaSqmMin === listing.areaSqmMax
    ? `${listing.areaSqmMin} sqm`
    : `${listing.areaSqmMin}–${listing.areaSqmMax} sqm`

  return `Outside the requested size band — units here run ${nearestBand}. Worth a look if the requirement can flex.`
}

/** Units in the requested band, apportioned across the bands the building serves. */
function unitsInBand(listing: SpaceListing, sizeBand: string): number {
  if (!listing.sizeBands.includes(sizeBand)) {
    return 0
  }

  return Math.max(1, Math.round(listing.unitsAvailable / listing.sizeBands.length))
}

function buildMarketProfile(
  matches: SpaceListingMatch[],
  intent: SpaceIntent,
  sizeBand: string,
): ReportMetric[] {
  if (matches.length === 0) {
    return []
  }

  const inBand = matches.filter((match) => match.listing.sizeBands.includes(sizeBand))
  const totalUnits = matches.reduce((total, match) => total + match.listing.unitsAvailable, 0)
  const bandUnits = inBand.reduce((total, match) => total + match.unitsInBand, 0)
  const distances = matches.map((match) => match.distanceKm)
  const nearest = Math.min(...distances)
  const average = distances.reduce((total, value) => total + value, 0) / distances.length

  const prices =
    intent === 'sale'
      ? matches.flatMap((match) =>
          match.listing.salePriceMin === undefined ? [] : [match.listing.salePriceMin],
        )
      : matches.flatMap((match) => (match.listing.rentMin === undefined ? [] : [match.listing.rentMin]))

  const priceFloor = prices.length > 0 ? Math.min(...prices) : 0
  const priceCeiling = prices.length > 0 ? Math.max(...prices) : 0
  const formatPrice = intent === 'sale' ? millions : peso

  return [
    {
      label: 'Units available',
      value: `${bandUnits} of ${totalUnits}`,
      hint: 'in the requested size band, across all matches',
    },
    {
      label: 'Buildings in band',
      value: `${inBand.length} of ${matches.length}`,
      hint: 'exact size-band matches',
    },
    {
      label: 'Entry price',
      value: prices.length > 0 ? formatPrice(priceFloor) : '—',
      hint: intent === 'sale' ? 'lowest asking price' : 'lowest monthly rent',
    },
    {
      label: 'Upper price',
      value: prices.length > 0 ? formatPrice(priceCeiling) : '—',
      hint: intent === 'sale' ? 'highest asking price' : 'highest starting rent',
    },
    {
      label: 'Nearest listing',
      value: `${nearest.toFixed(1)} km`,
      hint: 'straight-line from the area centroid',
    },
    {
      label: 'Average distance',
      value: `${average.toFixed(1)} km`,
      hint: `across ${matches.length} listings`,
    },
  ]
}

export function buildNearestSpacesReport(
  input: NearestSpacesInput,
  points: MapDrawPoint[],
  areaSummary: string,
  generatedAt: string,
  id: string,
): NearestSpacesReport {
  const intent: SpaceIntent = input.intent === 'sale' ? 'sale' : 'rent'
  const intentLabel = labelOf(SPACE_INTENTS, input.intent)
  const sizeLabel = labelOf(SPACE_SIZES, input.spaceSize)

  const centroid = centroidOf(points)

  const listings: SpaceListingMatch[] = SPACE_INVENTORY.filter((listing) =>
    listing.intents.includes(intent),
  )
    .map((listing) => {
      const distanceKm = haversineKm(centroid, { lat: listing.lat, lng: listing.lng })

      return {
        listing,
        distanceKm: Number(distanceKm.toFixed(1)),
        matchScore: scoreListing(listing, distanceKm, input.spaceSize, intent),
        matchReason: matchReasonFor(listing, distanceKm, input.spaceSize, sizeLabel, intent),
        priceLabel: priceLabelFor(listing, intent),
        unitsInBand: unitsInBand(listing, input.spaceSize),
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((match, index) => ({ ...match, rank: index + 1 }))

  const criteria: ReportMetric[] = [
    { label: 'Intent', value: intentLabel },
    {
      label: 'Space Size',
      value: sizeLabel,
      hint: SPACE_SIZES.find((size) => size.value === input.spaceSize)?.description,
    },
    {
      label: 'Search origin',
      value: `${centroid.lat.toFixed(4)}, ${centroid.lng.toFixed(4)}`,
      hint: 'centroid of the drawn area',
    },
    {
      label: 'Listings matched',
      value: `${listings.length}`,
      hint: 'ranked by proximity, size fit and inventory',
    },
  ]

  return {
    kind: 'nearest-spaces',
    id,
    generatedAt,
    areaSummary,
    disclaimer:
      'Prototype — static property data for Butuan City. Prices, unit counts and terms are illustrative; verify with the listing contact and inspect on site before committing.',
    criteria,
    marketProfile: buildMarketProfile(listings, intent, input.spaceSize),
    listings,
  }
}
