import type { Hazard } from '@/types/hazard.types'
import type { MapPinMarker } from '@/types/pinned-location.types'
import type { MapDrawPoint, MappedZone } from '@/types/zoning.types'

export type MapProvider = 'google' | 'leaflet'

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
  renderPinnedLocations(
    pins: MapPinMarker[],
    onPinClick?: ((pinId: string) => void) | null,
  ): Promise<void>
}
