import type { Hazard } from '@/types/hazard.types'
import type { MapPinMarker } from '@/types/pinned-location.types'
import type { MapDrawPoint, MappedZone } from '@/types/zoning.types'

export type MapProvider = 'google' | 'leaflet'

/**
 * Mirrors the category grouping MapTiler's own layer-visibility UI uses for
 * an OpenMapTiles-schema style (what `streets-v2` is built on).
 */
export type MapLayerCategory =
  | 'poi'
  | 'administrative'
  | 'built-up'
  | 'roads'
  | 'transit'
  | 'water'
  | 'nature'
  | 'background'

export interface MapLayerInfo {
  id: string
  label: string
  category: MapLayerCategory
}

export type MapProjectionType = 'globe' | 'mercator'

/**
 * MapLibre's globe projection has no native starfield/atmosphere-image
 * support — these presets are rendered by our own canvas overlay
 * (`globeSpaceOverlay.utils.ts`), not the MapLibre style spec.
 */
export type MapSpacePreset =
  | 'none'
  | 'space'
  | 'stars'
  | 'milky-way'
  | 'subtle-milky-way'
  | 'bright-milky-way'
  | 'colored-milky-way'

export interface MapSpaceSettings {
  preset: MapSpacePreset
  haloColor: string
  haloOpacity: number
  haloScale: number
}

export type MapLightAnchor = 'map' | 'viewport'

export interface MapLightSettings {
  anchor: MapLightAnchor
  color: string
  /** `[radial distance, azimuthal angle°, polar angle°]` — the raw MapLibre light-position triple. */
  position: [number, number, number]
  intensity: number
}

export interface MapSkySettings {
  skyColor: string
  horizonColor: string
  fogColor: string
}

export interface MapSettings {
  projection: MapProjectionType
  terrainEnabled: boolean
  space: MapSpaceSettings
  light: MapLightSettings
  sky: MapSkySettings
}

export type BarangayLngLat = [number, number]

export interface BarangayPolygonGeometry {
  type: 'Polygon'
  coordinates: BarangayLngLat[][]
}

export interface BarangayMultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: BarangayLngLat[][][]
}

export type BarangayGeometry = BarangayPolygonGeometry | BarangayMultiPolygonGeometry

export interface BarangayFeature {
  type: 'Feature'
  geometry: BarangayGeometry
  properties?: {
    brgy_name?: string
    [key: string]: unknown
  }
}

export interface BarangayFeatureCollection {
  type: 'FeatureCollection'
  features: BarangayFeature[]
}

export interface GooglePolygonPath {
  lat: number
  lng: number
}

/**
 * Imperative contract every map canvas component exposes through `defineExpose`.
 * The admin map store talks to whichever canvas is mounted through this shape
 * only, so MapLibre and Google canvases stay swappable per role.
 */
export interface MapCanvasApi {
  renderBarangayBorders(show: boolean, borders: BarangayFeatureCollection | null): Promise<void>
  renderMappedZones(zones: MappedZone[]): Promise<void>
  renderHazards(show: boolean, hazards: Hazard[]): Promise<void>
  renderDrawPreview(points: MapDrawPoint[]): Promise<void>
  focusOnZone(points: MapDrawPoint[]): Promise<void>
  focusLocation(point: { lat: number; lng: number }, label?: string): Promise<void>
  clearFocusMarker(): void
  setDrawMode(enabled: boolean): void
  setMapClickHandler(handler: ((point: MapDrawPoint) => void) | null): void
  setDrawPointMoveHandler(handler: ((index: number, point: MapDrawPoint) => void) | null): void
  setFreehandDrawHandler(handler: ((point: MapDrawPoint) => void) | null): void
  setCenter(center: { lat: number; lng: number }, zoom?: number): void
  getPoiTypes(): string[]
  setPoiTypeVisible(type: string, visible: boolean): void
  getMapLayers?(): MapLayerInfo[]
  setMapLayerVisible?(id: string, visible: boolean): void
  setMapProjection?(type: MapProjectionType): void
  setMapTerrain?(enabled: boolean): void
  setMapLight?(light: MapLightSettings): void
  setMapSky?(sky: MapSkySettings): void
  setMapSpace?(space: MapSpaceSettings): void
  renderPinnedLocations(
    pins: MapPinMarker[],
    onPinClick?: ((pinId: string) => void) | null,
  ): Promise<void>
  openPinnedLocation(pinId: string): boolean
}
