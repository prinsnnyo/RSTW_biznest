import { getSupabaseClient } from '@/services/supabase.client'
import type {
  CreateMappedZoneInput,
  CreateZoningLayerInput,
  MappedZone,
  MappedZoneRpcRow,
  MapDrawPoint,
  UpdateMappedZoneInput,
  UpdateZoningLayerInput,
  ZoningLayer,
} from '@/types/zoning.types'

const ZONING_LAYERS_TABLE = 'zoning_layers'
const MAPPED_ZONES_TABLE = 'mapped_zones'

async function getCurrentCityId(): Promise<string> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error('Unable to resolve current user city. Please sign in again.')
  }

  const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>
  const cityId = typeof metadata.city_id === 'string' ? metadata.city_id.trim() : ''

  if (!cityId) {
    throw new Error('Missing city_id in account metadata. Contact an administrator.')
  }

  return cityId
}

function normalizePolygonPoints(points: MapDrawPoint[]): [number, number][] {
  const ring = points.map((point) => [point.lng, point.lat] as [number, number])

  if (ring.length === 0) {
    return ring
  }

  const first = ring[0]
  const last = ring[ring.length - 1]

  if (!first || !last) {
    return ring
  }

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]])
  }

  return ring
}

function toMappedZone(row: MappedZoneRpcRow): MappedZone {
  const coordinates = row.geometry?.coordinates
  const outerRing =
    Array.isArray(coordinates) && Array.isArray(coordinates[0]) ? coordinates[0] : []

  const points = Array.isArray(outerRing)
    ? outerRing
        .filter((coordinate) => Array.isArray(coordinate) && coordinate.length >= 2)
        .map((coordinate) => ({
          lng: Number(coordinate[0]),
          lat: Number(coordinate[1]),
        }))
        .filter((point) => !Number.isNaN(point.lat) && !Number.isNaN(point.lng))
    : []

  const normalizedPoints =
    points.length > 1 &&
    points[0]?.lat === points[points.length - 1]?.lat &&
    points[0]?.lng === points[points.length - 1]?.lng
      ? points.slice(0, -1)
      : points

  return {
    id: row.id,
    zoning_layer_id: row.zoning_layer_id,
    zoning_title: row.zoning_title,
    zoning_color: row.zoning_color,
    name: row.name,
    description: row.description,
    is_visible: row.is_visible,
    points: normalizedPoints,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// The "year" column is a Postgres `date` (there is no real year type), stored
// as Jan 1 of that year — convert at the service boundary so the rest of the
// app only ever deals with a plain number.
function yearToDateString(year: number): string {
  return `${year}-01-01`
}

function dateToYear(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value.slice(0, 4))
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return new Date().getFullYear()
}

function toZoningLayer(row: Record<string, unknown>): ZoningLayer {
  return {
    id: String(row.id),
    title: String(row.title),
    color: String(row.color),
    description: (row.description as string | null) ?? null,
    year: dateToYear(row.year),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function toGeoJsonGeometry(value: unknown): { type?: string; coordinates?: unknown } | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as { type?: string; coordinates?: unknown }
      return typeof parsed === 'object' && parsed !== null ? parsed : null
    } catch {
      return null
    }
  }

  if (typeof value === 'object') {
    const typed = value as { type?: string; coordinates?: unknown }
    return typed
  }

  return null
}

export async function listCityZoningLayers(): Promise<ZoningLayer[]> {
  const supabase = getSupabaseClient()
  const cityId = await getCurrentCityId()

  const { data, error } = await supabase
    .from(ZONING_LAYERS_TABLE)
    .select('id, title, color, description, year, is_active, created_at, updated_at')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => toZoningLayer(row as Record<string, unknown>))
}

export const listMyZoningLayers = listCityZoningLayers

export async function createZoningLayer(input: CreateZoningLayerInput): Promise<ZoningLayer> {
  const supabase = getSupabaseClient()

  const payload = {
    title: input.title.trim(),
    color: input.color,
    description: input.description.trim() || null,
    year: yearToDateString(input.year),
  }

  const { data, error } = await supabase
    .from(ZONING_LAYERS_TABLE)
    .insert(payload)
    .select('id, title, color, description, year, is_active, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return toZoningLayer(data as Record<string, unknown>)
}

export async function updateZoningLayer(
  layerId: string,
  input: UpdateZoningLayerInput,
): Promise<ZoningLayer> {
  const supabase = getSupabaseClient()
  const cityId = await getCurrentCityId()
  const payload = {
    title: input.title.trim(),
    color: input.color,
    description: input.description.trim() || null,
    year: yearToDateString(input.year),
  }

  const { data, error } = await supabase
    .from(ZONING_LAYERS_TABLE)
    .update(payload)
    .eq('id', layerId)
    .eq('city_id', cityId)
    .select('id, title, color, description, year, is_active, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return toZoningLayer(data as Record<string, unknown>)
}

export async function deleteZoningLayer(layerId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const cityId = await getCurrentCityId()
  const { error } = await supabase
    .from(ZONING_LAYERS_TABLE)
    .delete()
    .eq('id', layerId)
    .eq('city_id', cityId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function setZoningLayerActive(
  layerId: string,
  isActive: boolean,
): Promise<ZoningLayer> {
  const supabase = getSupabaseClient()
  const cityId = await getCurrentCityId()

  const { data, error } = await supabase
    .from(ZONING_LAYERS_TABLE)
    .update({ is_active: isActive })
    .eq('id', layerId)
    .eq('city_id', cityId)
    .select('id, title, color, description, year, is_active, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return toZoningLayer(data as Record<string, unknown>)
}

export async function listCityMappedZones(): Promise<MappedZone[]> {
  const supabase = getSupabaseClient()
  const cityId = await getCurrentCityId()

  const { data, error } = await supabase
    .from(MAPPED_ZONES_TABLE)
    .select(
      `id, zoning_layer_id, name, description, is_visible, created_at, updated_at, geom, zoning_layers!inner(title, color)`,
    )
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []).map((row) => {
    const typed = row as {
      id: string
      zoning_layer_id: string
      name: string
      description: string | null
      is_visible: boolean
      created_at: string
      updated_at: string
      geom?: unknown
      geometry?: unknown
      zoning_layers?: { title?: string | null; color?: string | null } | null
    }

    return {
      id: typed.id,
      zoning_layer_id: typed.zoning_layer_id,
      zoning_title: typed.zoning_layers?.title ?? 'Untitled Layer',
      zoning_color: typed.zoning_layers?.color ?? '#64748b',
      name: typed.name,
      description: typed.description,
      is_visible: typed.is_visible,
      geometry: toGeoJsonGeometry(typed.geometry ?? typed.geom),
      created_at: typed.created_at,
      updated_at: typed.updated_at,
    } satisfies MappedZoneRpcRow
  })

  return rows.map(toMappedZone)
}

export const listMyMappedZones = listCityMappedZones

export async function createMappedZone(input: CreateMappedZoneInput): Promise<void> {
  const supabase = getSupabaseClient()

  if (input.points.length < 3) {
    throw new Error('A mapped zone needs at least 3 points.')
  }

  const polygonRing = normalizePolygonPoints(input.points)
  const geometry = {
    type: 'Polygon',
    coordinates: [polygonRing],
  }

  const { error } = await supabase.rpc('create_mapped_zone', {
    p_zoning_layer_id: input.zoningLayerId,
    p_name: input.name.trim(),
    p_description: input.description.trim() || null,
    p_geojson: geometry,
    p_is_visible: true,
  })

  if (error) {
    if (error.message.includes('Invalid zoning layer for current city')) {
      throw new Error(
        'Selected zoning layer does not belong to your assigned city. Reload zoning layers and pick a valid layer.',
      )
    }

    throw new Error(error.message)
  }
}

export async function updateMappedZone(
  zoneId: string,
  input: UpdateMappedZoneInput,
): Promise<void> {
  const supabase = getSupabaseClient()

  if (input.points) {
    if (input.points.length < 3) {
      throw new Error('A mapped zone needs at least 3 points.')
    }

    const polygonRing = normalizePolygonPoints(input.points)
    const geometry = {
      type: 'Polygon',
      coordinates: [polygonRing],
    }

    const { error } = await supabase.rpc('update_mapped_zone', {
      p_zone_id: zoneId,
      p_zoning_layer_id: input.zoningLayerId,
      p_name: input.name.trim(),
      p_description: input.description.trim() || null,
      p_geojson: geometry,
    })

    if (error) {
      if (error.message.includes('Invalid zoning layer for current city')) {
        throw new Error(
          'Selected zoning layer does not belong to your assigned city. Reload zoning layers and pick a valid layer.',
        )
      }

      throw new Error(error.message)
    }

    return
  }

  const cityId = await getCurrentCityId()
  const payload = {
    zoning_layer_id: input.zoningLayerId,
    name: input.name.trim(),
    description: input.description.trim() || null,
  }

  const { error } = await supabase
    .from(MAPPED_ZONES_TABLE)
    .update(payload)
    .eq('id', zoneId)
    .eq('city_id', cityId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteMappedZone(zoneId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const cityId = await getCurrentCityId()
  const { error } = await supabase
    .from(MAPPED_ZONES_TABLE)
    .delete()
    .eq('id', zoneId)
    .eq('city_id', cityId)

  if (error) {
    throw new Error(error.message)
  }
}
