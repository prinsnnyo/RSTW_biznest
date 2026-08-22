import {
  Map as MapLibreMap,
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  ScaleControl,
  AttributionControl,
} from 'maplibre-gl'
import type {
  ControlPosition,
  FitBoundsOptions,
  FlyToOptions,
  GeoJSONSource,
  GeoJSONSourceSpecification,
  LayerSpecification,
  LngLatBoundsLike,
  LngLatLike,
  MapEventType,
  MapGeoJSONFeature,
  MapLayerEventType,
  MarkerOptions,
  PopupOptions,
  QueryRenderedFeaturesOptions,
  SourceSpecification,
  StyleSpecification,
} from 'maplibre-gl'

export type MapLibreTheme = 'light' | 'dark'
export type LatLng = { lat: number; lng: number }

export interface MapLibreEngineOptions {
  container: HTMLElement | string
  center?: LatLng
  zoom?: number
  apiKey?: string
  styleUrl?: string
  theme?: MapLibreTheme
  interactive?: boolean
}

export interface MapLibreInitOverrides {
  apiKey?: string
  styleUrl?: string
  center?: LatLng
  zoom?: number
}

const MAPTILER_STYLE_BASE_URL = 'https://api.maptiler.com/maps'
const MAPTILER_LIGHT_STYLE = 'streets-v2'
const MAPTILER_DARK_STYLE = 'streets-v2-dark'
const DEFAULT_CENTER: LatLng = { lat: 8.9475, lng: 125.5406 }
const DEFAULT_ZOOM = 14

export function buildMaptilerStyleUrl(styleId: string, apiKey: string): string {
  return `${MAPTILER_STYLE_BASE_URL}/${styleId}/style.json?key=${apiKey}`
}

function toLngLat(point: LatLng): [number, number] {
  return [point.lng, point.lat]
}

export class MapLibreEngine {
  private map: MapLibreMap | null = null
  private markers = new Map<string, Marker>()
  private popups = new Map<string, Popup>()
  private options: MapLibreEngineOptions
  private currentTheme: MapLibreTheme

  constructor(options: MapLibreEngineOptions) {
    this.options = options
    this.currentTheme = options.theme ?? 'light'
  }

  private resolveStyle(
    overrides?: MapLibreInitOverrides,
    theme: MapLibreTheme = this.currentTheme,
  ): string {
    const styleUrl = overrides?.styleUrl ?? this.options.styleUrl
    if (styleUrl) {
      return styleUrl
    }

    const apiKey = overrides?.apiKey ?? this.options.apiKey
    if (!apiKey) {
      throw new Error('MapLibreEngine: missing MapTiler apiKey or styleUrl')
    }

    return buildMaptilerStyleUrl(
      theme === 'dark' ? MAPTILER_DARK_STYLE : MAPTILER_LIGHT_STYLE,
      apiKey,
    )
  }

  private requireMap(): MapLibreMap {
    if (!this.map) {
      throw new Error('MapLibreEngine: map not initialized. Call init() first.')
    }
    return this.map
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────
  async init(overrides?: MapLibreInitOverrides): Promise<void> {
    if (this.map) {
      return
    }

    if (overrides?.apiKey) {
      this.options.apiKey = overrides.apiKey
    }
    if (overrides?.styleUrl) {
      this.options.styleUrl = overrides.styleUrl
    }

    const center = overrides?.center ?? this.options.center ?? DEFAULT_CENTER
    const zoom = overrides?.zoom ?? this.options.zoom ?? DEFAULT_ZOOM

    this.map = new MapLibreMap({
      container: this.options.container,
      style: this.resolveStyle(overrides),
      center: toLngLat(center),
      zoom,
      interactive: this.options.interactive ?? true,
      attributionControl: false,
    })

    await new Promise<void>((resolve, reject) => {
      this.map?.once('load', () => resolve())
      this.map?.once('error', (event) =>
        reject(event.error ?? new Error('MapLibre failed to load')),
      )
    })
  }

  destroy(): void {
    this.clearMarkers()
    this.clearPopups()
    this.map?.remove()
    this.map = null
  }

  getMap(): MapLibreMap | null {
    return this.map
  }

  isReady(): boolean {
    return this.map !== null
  }

  loaded(): boolean {
    return this.map?.loaded() ?? false
  }

  resize(): void {
    this.map?.resize()
  }

  // ── Camera ──────────────────────────────────────────────────────────────
  setCenter(center: LatLng, zoom?: number): void {
    if (!this.map) return
    this.map.jumpTo({ center: toLngLat(center), zoom: zoom ?? this.map.getZoom() })
  }

  flyTo(center: LatLng, options?: Omit<FlyToOptions, 'center'>): void {
    this.map?.flyTo({ center: toLngLat(center), ...options })
  }

  fitBounds(bounds: LngLatBoundsLike, options?: FitBoundsOptions): void {
    this.map?.fitBounds(bounds, options)
  }

  focusOnPoints(points: LatLng[], zoom = 16): void {
    if (!this.map || points.length === 0) return

    const [firstPoint] = points
    if (points.length === 1 && firstPoint) {
      this.flyTo(firstPoint, { zoom })
      return
    }

    const lngs = points.map((point) => point.lng)
    const lats = points.map((point) => point.lat)

    this.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, maxZoom: zoom },
    )
  }

  getCenter(): LatLng | null {
    if (!this.map) return null
    const center = this.map.getCenter()
    return { lat: center.lat, lng: center.lng }
  }

  getZoom(): number | null {
    return this.map?.getZoom() ?? null
  }

  setZoom(zoom: number): void {
    this.map?.setZoom(zoom)
  }

  getBounds(): LngLatBoundsLike | null {
    return this.map?.getBounds() ?? null
  }

  // ── Style / theme ─────────────────────────────────────────────────────────
  setStyle(style: StyleSpecification | string): void {
    this.map?.setStyle(style)
  }

  setTheme(theme: MapLibreTheme): void {
    if (this.currentTheme === theme) return
    this.currentTheme = theme
    if (this.map) {
      this.map.setStyle(this.resolveStyle(undefined, theme))
    }
  }

  getTheme(): MapLibreTheme {
    return this.currentTheme
  }

  // ── Sources ───────────────────────────────────────────────────────────────
  addGeoJsonSource(id: string, data: GeoJSONSourceSpecification['data']): void {
    const map = this.requireMap()
    if (map.getSource(id)) {
      this.setSourceData(id, data)
      return
    }
    map.addSource(id, { type: 'geojson', data })
  }

  setSourceData(id: string, data: GeoJSONSourceSpecification['data']): void {
    const source = this.map?.getSource(id)
    if (source?.type === 'geojson') {
      ;(source as GeoJSONSource).setData(data)
    }
  }

  addSource(id: string, source: SourceSpecification): void {
    const map = this.requireMap()
    if (map.getSource(id)) return
    map.addSource(id, source)
  }

  removeSource(id: string): void {
    if (this.map?.getSource(id)) {
      this.map.removeSource(id)
    }
  }

  hasSource(id: string): boolean {
    return Boolean(this.map?.getSource(id))
  }

  // ── Layers ────────────────────────────────────────────────────────────────
  addLayer(layer: LayerSpecification, beforeId?: string): void {
    const map = this.requireMap()
    if (map.getLayer(layer.id)) return
    map.addLayer(layer, beforeId)
  }

  removeLayer(id: string): void {
    if (this.map?.getLayer(id)) {
      this.map.removeLayer(id)
    }
  }

  hasLayer(id: string): boolean {
    return Boolean(this.map?.getLayer(id))
  }

  setLayerVisibility(id: string, visible: boolean): void {
    if (this.map?.getLayer(id)) {
      this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    }
  }

  setPaintProperty(id: string, name: string, value: unknown): void {
    const setPaintProperty = this.map?.setPaintProperty.bind(this.map) as
      | ((layerId: string, name: string, value: unknown) => void)
      | undefined
    setPaintProperty?.(id, name, value)
  }

  setLayoutProperty(id: string, name: string, value: unknown): void {
    const setLayoutProperty = this.map?.setLayoutProperty.bind(this.map) as
      | ((layerId: string, name: string, value: unknown) => void)
      | undefined
    setLayoutProperty?.(id, name, value)
  }

  queryRenderedFeatures(
    geometry?: Parameters<MapLibreMap['queryRenderedFeatures']>[0],
    options?: QueryRenderedFeaturesOptions,
  ): MapGeoJSONFeature[] {
    return this.map?.queryRenderedFeatures(geometry, options) ?? []
  }

  // ── Markers ───────────────────────────────────────────────────────────────
  addMarker(id: string, lngLat: LngLatLike, options?: MarkerOptions): Marker | null {
    if (!this.map) return null
    this.removeMarker(id)
    const marker = new Marker(options).setLngLat(lngLat).addTo(this.map)
    this.markers.set(id, marker)
    return marker
  }

  removeMarker(id: string): void {
    this.markers.get(id)?.remove()
    this.markers.delete(id)
  }

  clearMarkers(): void {
    this.markers.forEach((marker) => marker.remove())
    this.markers.clear()
  }

  getMarker(id: string): Marker | undefined {
    return this.markers.get(id)
  }

  // ── Popups ────────────────────────────────────────────────────────────────
  openPopup(id: string, lngLat: LngLatLike, html: string, options?: PopupOptions): Popup | null {
    if (!this.map) return null
    this.closePopup(id)
    const popup = new Popup(options).setLngLat(lngLat).setHTML(html).addTo(this.map)
    this.popups.set(id, popup)
    return popup
  }

  closePopup(id: string): void {
    this.popups.get(id)?.remove()
    this.popups.delete(id)
  }

  clearPopups(): void {
    this.popups.forEach((popup) => popup.remove())
    this.popups.clear()
  }

  // ── Controls ──────────────────────────────────────────────────────────────
  addNavigationControl(position: ControlPosition = 'bottom-right'): void {
    this.map?.addControl(new NavigationControl(), position)
  }

  addGeolocateControl(position: ControlPosition = 'bottom-right'): GeolocateControl | null {
    if (!this.map) return null
    const control = new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    })
    this.map.addControl(control, position)
    return control
  }

  addScaleControl(position: ControlPosition = 'bottom-left'): void {
    this.map?.addControl(new ScaleControl(), position)
  }

  addAttributionControl(position: ControlPosition = 'bottom-right', compact = true): void {
    this.map?.addControl(new AttributionControl({ compact }), position)
  }

  // ── Cursor / interaction ──────────────────────────────────────────────────
  setCursor(cursor: string): void {
    if (!this.map) return
    this.map.getCanvas().style.cursor = cursor
  }

  setInteractive(enabled: boolean): void {
    if (!this.map) return
    const handlers = [
      this.map.dragPan,
      this.map.scrollZoom,
      this.map.boxZoom,
      this.map.dragRotate,
      this.map.doubleClickZoom,
      this.map.touchZoomRotate,
    ]
    handlers.forEach((handler) => (enabled ? handler.enable() : handler.disable()))
  }

  enableHoverCursor(layerId: string, cursor = 'pointer'): () => void {
    const map = this.requireMap()
    const onEnter = (): void => {
      map.getCanvas().style.cursor = cursor
    }
    const onLeave = (): void => {
      map.getCanvas().style.cursor = ''
    }

    map.on('mouseenter', layerId, onEnter)
    map.on('mouseleave', layerId, onLeave)

    return () => {
      map.off('mouseenter', layerId, onEnter)
      map.off('mouseleave', layerId, onLeave)
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────
  on<K extends keyof MapEventType>(type: K, handler: (event: MapEventType[K]) => void): () => void
  on<K extends keyof MapLayerEventType>(
    type: K,
    layerId: string | string[],
    handler: (event: MapLayerEventType[K]) => void,
  ): () => void
  on(type: string, layerIdOrHandler: unknown, maybeHandler?: unknown): () => void {
    const map = this.requireMap()

    if (typeof layerIdOrHandler === 'function') {
      const handler = layerIdOrHandler as (event: never) => void
      map.on(type as never, handler)
      return () => map.off(type as never, handler)
    }

    const layerId = layerIdOrHandler as string | string[]
    const handler = maybeHandler as (event: never) => void
    map.on(type as never, layerId as never, handler)
    return () => map.off(type as never, layerId as never, handler)
  }
}
