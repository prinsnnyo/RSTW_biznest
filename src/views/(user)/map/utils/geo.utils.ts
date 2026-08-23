// Shared geometry for the smart-analysis reports: where the drawn area sits and
// how far a fixed point is from it. Pure maths, no reactivity.
import type { MapDrawPoint } from '@/types/zoning.types'

const EARTH_RADIUS_KM = 6371

/** Butuan City centre — the map's own default, used when nothing is drawn. */
const DEFAULT_CENTRE: MapDrawPoint = { lat: 8.9475, lng: 125.5406 }

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function centroidOf(points: MapDrawPoint[]): MapDrawPoint {
  if (points.length === 0) {
    return DEFAULT_CENTRE
  }

  const total = points.reduce(
    (accumulator, point) => ({
      lat: accumulator.lat + point.lat,
      lng: accumulator.lng + point.lng,
    }),
    { lat: 0, lng: 0 },
  )

  return { lat: total.lat / points.length, lng: total.lng / points.length }
}

/** Great-circle distance in kilometres. */
export function haversineKm(from: MapDrawPoint, to: MapDrawPoint): number {
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
