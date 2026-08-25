import type { HazardGeometry, HazardGeometryType } from '@/types/hazard.types'

const GEOMETRY_TYPES = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
] as const

const isSupportedGeometry = (value: unknown): value is HazardGeometry => {
  if (value === null || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    GEOMETRY_TYPES.includes(candidate.type as (typeof GEOMETRY_TYPES)[number]) &&
    Array.isArray(candidate.coordinates)
  )
}

const extractGeometry = (raw: unknown): HazardGeometry => {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('File is not valid GeoJSON.')
  }

  const candidate = raw as Record<string, unknown>

  if (candidate.type === 'FeatureCollection') {
    const features = candidate.features
    if (!Array.isArray(features) || features.length === 0) {
      throw new Error('GeoJSON FeatureCollection has no features.')
    }
    return extractGeometry((features[0] as Record<string, unknown>).geometry)
  }

  if (candidate.type === 'Feature') {
    return extractGeometry(candidate.geometry)
  }

  if (isSupportedGeometry(candidate)) {
    return candidate
  }

  throw new Error(
    `Unsupported geometry type "${String(candidate.type)}". ` +
      'Only Point, LineString, Polygon, MultiPoint, MultiLineString, or MultiPolygon is supported.',
  )
}

export const parseHazardGeoJsonFile = async (
  file: Blob,
): Promise<{ geometry: HazardGeometry; geometryType: HazardGeometryType }> => {
  const text = await file.text()

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON.')
  }

  const geometry = extractGeometry(raw)

  return {
    geometry,
    geometryType: geometry.type.toLowerCase() as HazardGeometryType,
  }
}
