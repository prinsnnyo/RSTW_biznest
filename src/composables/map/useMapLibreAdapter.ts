import type { Ref } from 'vue'
import type { GeoJSONSourceSpecification, LayerSpecification, Marker } from 'maplibre-gl'
import { Popup as MapLibrePopup } from 'maplibre-gl'
import type { BarangayFeatureCollection } from '@/types/map.types'
import type { Hazard } from '@/types/hazard.types'
import type { MapDrawPoint, MappedZone } from '@/types/zoning.types'
import type { MapPinMarker } from '@/types/pinned-location.types'
import { MapLibreEngine, type MapLibreTheme } from '@/engine/maplibre.egine'
import { getBarangayLabel, getBorderColor } from '@/utils/map/barangayBorder.utils'
import { createPinIconSrc } from '@/utils/pin-icon.utils'
import { buildPinPopupHtml, PIN_POPUP_CLASS } from '@/utils/map/pinPopup.utils'

interface MapLibreAdapterOptions {
  containerRef: Ref<HTMLDivElement | null>
  center: { lat: number; lng: number }
  zoom?: number
  pitch?: number
  getApiKey?: () => string
  styleUrl?: string
}

type MapClickHandler = (point: MapDrawPoint) => void
type DrawPointMoveHandler = (index: number, point: MapDrawPoint) => void
type FreehandPointHandler = (point: MapDrawPoint) => void
type PinClickHandler = (pinId: string) => void
type CameraIdleHandler = (camera: {
  zoom: number
  pitch: number
  center: { lat: number; lng: number }
}) => void

const DRAW_MODE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 20l4-1 9.5-9.5-3-3L5 16z' fill='%231f2937'/%3E%3Cpath d='M14.5 6.5l3 3 1-1a1.6 1.6 0 000-2.2l-.8-.8a1.6 1.6 0 00-2.2 0z' fill='%230f172a'/%3E%3C/svg%3E\") 2 20, crosshair"

// Sample a new freehand vertex only after the cursor has moved this many
// screen pixels from the last sampled point — lat/lng distance isn't
// uniform across zoom levels, so the threshold has to be in screen space.
const FREEHAND_MIN_PIXEL_DISTANCE = 8

const BARANGAY_SOURCE_ID = 'ml-barangay-borders'
const BARANGAY_FILL_LAYER_ID = 'ml-barangay-borders-fill'
const BARANGAY_LINE_LAYER_ID = 'ml-barangay-borders-line'
const BARANGAY_POPUP_ID = 'ml-barangay-popup'

const MAPPED_ZONES_SOURCE_ID = 'ml-mapped-zones'
const MAPPED_ZONES_FILL_LAYER_ID = 'ml-mapped-zones-fill'
const MAPPED_ZONES_LINE_LAYER_ID = 'ml-mapped-zones-line'
const MAPPED_ZONES_POPUP_ID = 'ml-mapped-zones-popup'

const HAZARDS_SOURCE_ID = 'ml-hazards'
const HAZARDS_POLYGON_LAYER_ID = 'ml-hazards-polygon'
const HAZARDS_POLYGON_OUTLINE_LAYER_ID = 'ml-hazards-polygon-outline'
const HAZARDS_LINE_LAYER_ID = 'ml-hazards-line'
const HAZARDS_POINT_LAYER_ID = 'ml-hazards-point'
const HAZARDS_POPUP_ID = 'ml-hazards-popup'

const DRAW_PREVIEW_SOURCE_ID = 'ml-draw-preview'
const DRAW_PREVIEW_FILL_LAYER_ID = 'ml-draw-preview-fill'
const DRAW_PREVIEW_LINE_LAYER_ID = 'ml-draw-preview-line'
const DRAW_PREVIEW_VERTEX_ID_PREFIX = 'ml-draw-preview-vertex-'

const FOCUS_MARKER_ID = 'ml-focus-marker'
const FOCUS_POPUP_ID = 'ml-focus-popup'
const PIN_MARKER_ID_PREFIX = 'ml-pin-'

function buildHtmlFromNode(build: (container: HTMLDivElement) => void): string {
  const container = document.createElement('div')
  build(container)
  return container.outerHTML
}

export function useMapLibreAdapter(options: MapLibreAdapterOptions) {
  let engine: MapLibreEngine | null = null
  let mapClickHandler: MapClickHandler | null = null
  let drawPointMoveHandler: DrawPointMoveHandler | null = null
  let freehandPointHandler: FreehandPointHandler | null = null
  let clickUnsubscribe: (() => void) | null = null
  let freehandUnsubscribes: Array<() => void> = []
  let isFreehandDragging = false
  let lastFreehandScreenPoint: { x: number; y: number } | null = null
  let cameraIdleUnsubscribe: (() => void) | null = null
  let cameraIdleHandler: CameraIdleHandler | null = null
  let barangayHoverCleanup: (() => void) | null = null
  let barangayMoveCleanup: (() => void) | null = null
  let barangayLeaveCleanup: (() => void) | null = null
  let mappedZonesClickCleanup: (() => void) | null = null
  let hazardsClickCleanup: (() => void) | null = null
  let drawPreviewVertexIds: string[] = []
  let pinMarkerIds: string[] = []
  let poiLayerIds: string[] = []
  let isDrawMode = false
  let currentTheme: MapLibreTheme = 'light'
  const hiddenPoiTypes = new Set<string>()

  let lastBarangayArgs: [boolean, BarangayFeatureCollection | null] | null = null
  let lastMappedZones: MappedZone[] | null = null
  let lastHazardsArgs: [boolean, Hazard[]] | null = null
  let lastDrawPoints: MapDrawPoint[] | null = null
  let lastPins: { pins: MapPinMarker[]; handler: PinClickHandler | null } | null = null

  function applyCursor(): void {
    engine?.setCursor(isDrawMode ? DRAW_MODE_CURSOR : '')
  }

  function cachePoiLayerIds(): void {
    const styleLayers = engine?.getMap()?.getStyle()?.layers ?? []
    poiLayerIds = styleLayers
      .filter((layer) => 'source-layer' in layer && layer['source-layer'] === 'poi')
      .map((layer) => layer.id)
  }

  function getPoiTypes(): string[] {
    return [...poiLayerIds]
  }

  function applyPoiVisibility(): void {
    poiLayerIds.forEach((id) => engine?.setLayerVisibility(id, !hiddenPoiTypes.has(id)))
  }

  function setPoiTypeVisible(type: string, visible: boolean): void {
    if (visible) {
      hiddenPoiTypes.delete(type)
    } else {
      hiddenPoiTypes.add(type)
    }
    engine?.setLayerVisibility(type, visible)
  }

  function clearClickListener(): void {
    clickUnsubscribe?.()
    clickUnsubscribe = null
  }

  function clearCameraIdleListener(): void {
    cameraIdleUnsubscribe?.()
    cameraIdleUnsubscribe = null
  }

  function syncCameraIdleListener(): void {
    clearCameraIdleListener()

    if (!engine || !cameraIdleHandler) {
      return
    }

    cameraIdleUnsubscribe = engine.on('moveend', () => {
      const zoom = engine?.getZoom()
      const pitch = engine?.getPitch()
      const center = engine?.getCenter()
      if (zoom == null || pitch == null || center == null) {
        return
      }
      cameraIdleHandler?.({ zoom, pitch, center })
    })
  }

  function syncClickListener(): void {
    clearClickListener()

    if (!engine || !mapClickHandler) {
      return
    }

    clickUnsubscribe = engine.on('click', (event) => {
      mapClickHandler?.({ lat: event.lngLat.lat, lng: event.lngLat.lng })
    })
  }

  function clearFreehandListeners(): void {
    freehandUnsubscribes.forEach((unsubscribe) => unsubscribe())
    freehandUnsubscribes = []

    // Force-restore interactivity if this teardown happens mid-drag
    // (e.g. mode switched back to manual while the mouse button is down).
    if (isFreehandDragging) {
      engine?.setInteractive(true)
    }
    isFreehandDragging = false
    lastFreehandScreenPoint = null
  }

  function syncFreehandDrawHandler(): void {
    clearFreehandListeners()

    if (!engine || !freehandPointHandler) {
      return
    }

    const onMouseDown = engine.on('mousedown', (event) => {
      isFreehandDragging = true
      lastFreehandScreenPoint = { x: event.point.x, y: event.point.y }
      engine?.setInteractive(false)
      freehandPointHandler?.({ lat: event.lngLat.lat, lng: event.lngLat.lng })
    })

    const onMouseMove = engine.on('mousemove', (event) => {
      if (!isFreehandDragging) {
        return
      }

      const { x, y } = event.point
      if (lastFreehandScreenPoint) {
        const dx = x - lastFreehandScreenPoint.x
        const dy = y - lastFreehandScreenPoint.y
        if (Math.hypot(dx, dy) < FREEHAND_MIN_PIXEL_DISTANCE) {
          return
        }
      }

      lastFreehandScreenPoint = { x, y }
      freehandPointHandler?.({ lat: event.lngLat.lat, lng: event.lngLat.lng })
    })

    const onMouseUp = engine.on('mouseup', () => {
      isFreehandDragging = false
      lastFreehandScreenPoint = null
      engine?.setInteractive(true)
    })

    freehandUnsubscribes = [onMouseDown, onMouseMove, onMouseUp]
  }

  function setFreehandDrawHandler(handler: FreehandPointHandler | null): void {
    freehandPointHandler = handler
    syncFreehandDrawHandler()
  }

  function removeBarangayLayers(): void {
    barangayMoveCleanup?.()
    barangayMoveCleanup = null
    barangayLeaveCleanup?.()
    barangayLeaveCleanup = null
    barangayHoverCleanup?.()
    barangayHoverCleanup = null
    engine?.closePopup(BARANGAY_POPUP_ID)
    engine?.removeLayer(BARANGAY_FILL_LAYER_ID)
    engine?.removeLayer(BARANGAY_LINE_LAYER_ID)
    engine?.removeSource(BARANGAY_SOURCE_ID)
  }

  function removeMappedZonesLayers(): void {
    mappedZonesClickCleanup?.()
    mappedZonesClickCleanup = null
    engine?.closePopup(MAPPED_ZONES_POPUP_ID)
    engine?.removeLayer(MAPPED_ZONES_FILL_LAYER_ID)
    engine?.removeLayer(MAPPED_ZONES_LINE_LAYER_ID)
    engine?.removeSource(MAPPED_ZONES_SOURCE_ID)
  }

  function removeHazardsLayers(): void {
    hazardsClickCleanup?.()
    hazardsClickCleanup = null
    engine?.closePopup(HAZARDS_POPUP_ID)
    engine?.removeLayer(HAZARDS_POLYGON_LAYER_ID)
    engine?.removeLayer(HAZARDS_POLYGON_OUTLINE_LAYER_ID)
    engine?.removeLayer(HAZARDS_LINE_LAYER_ID)
    engine?.removeLayer(HAZARDS_POINT_LAYER_ID)
    engine?.removeSource(HAZARDS_SOURCE_ID)
  }

  function removeDrawPreviewLayers(): void {
    drawPreviewVertexIds.forEach((id) => engine?.removeMarker(id))
    drawPreviewVertexIds = []
    engine?.removeLayer(DRAW_PREVIEW_FILL_LAYER_ID)
    engine?.removeLayer(DRAW_PREVIEW_LINE_LAYER_ID)
    engine?.removeSource(DRAW_PREVIEW_SOURCE_ID)
  }

  function destroyFocusMarker(): void {
    engine?.removeMarker(FOCUS_MARKER_ID)
    engine?.closePopup(FOCUS_POPUP_ID)
  }

  function destroyPinMarkers(): void {
    pinMarkerIds.forEach((id) => engine?.removeMarker(id))
    pinMarkerIds = []
  }

  async function init(): Promise<void> {
    if (!options.containerRef.value) {
      return
    }

    engine = new MapLibreEngine({
      container: options.containerRef.value,
      center: options.center,
      zoom: options.zoom,
      pitch: options.pitch,
      apiKey: options.getApiKey?.(),
      styleUrl: options.styleUrl,
      theme: currentTheme,
    })

    await engine.init()

    engine.addNavigationControl()
    engine.addAttributionControl('bottom-right', true)

    applyCursor()
    cachePoiLayerIds()
    applyPoiVisibility()
    syncClickListener()
    syncCameraIdleListener()
  }

  function setCameraIdleHandler(handler: CameraIdleHandler | null): void {
    cameraIdleHandler = handler
    syncCameraIdleListener()
  }

  function destroy(): void {
    clearClickListener()
    clearFreehandListeners()
    clearCameraIdleListener()
    removeBarangayLayers()
    removeMappedZonesLayers()
    removeHazardsLayers()
    removeDrawPreviewLayers()
    destroyFocusMarker()
    destroyPinMarkers()
    engine?.destroy()
    engine = null
  }

  function setCenter(center: { lat: number; lng: number }, zoom?: number): void {
    engine?.setCenter(center, zoom)
  }

  function setDrawMode(enabled: boolean): void {
    isDrawMode = enabled
    applyCursor()
  }

  function setTheme(theme: MapLibreTheme): void {
    currentTheme = theme

    if (!engine) {
      return
    }

    engine.setTheme(theme)
    engine.getMap()?.once('styledata', () => {
      cachePoiLayerIds()
      applyPoiVisibility()
      reapplyOverlays()
    })
  }

  function setMapClickHandler(handler: MapClickHandler | null): void {
    mapClickHandler = handler
    syncClickListener()
  }

  function setDrawPointMoveHandler(handler: DrawPointMoveHandler | null): void {
    drawPointMoveHandler = handler
  }

  async function renderBarangayBorders(
    showBarangayBorders: boolean,
    barangayBorders: BarangayFeatureCollection | null,
  ): Promise<void> {
    lastBarangayArgs = [showBarangayBorders, barangayBorders]
    removeBarangayLayers()

    if (!engine || !showBarangayBorders || !barangayBorders) {
      return
    }

    const featureCollection = {
      type: 'FeatureCollection',
      features: barangayBorders.features.map((feature, index) => ({
        type: 'Feature',
        properties: {
          ...feature.properties,
          __color: getBorderColor(index),
          __label: getBarangayLabel(feature, index),
        },
        geometry: feature.geometry,
      })),
    }

    engine.addGeoJsonSource(
      BARANGAY_SOURCE_ID,
      featureCollection as GeoJSONSourceSpecification['data'],
    )

    engine.addLayer({
      id: BARANGAY_FILL_LAYER_ID,
      type: 'fill',
      source: BARANGAY_SOURCE_ID,
      paint: { 'fill-color': ['get', '__color'], 'fill-opacity': 0.1 },
    } as LayerSpecification)

    engine.addLayer({
      id: BARANGAY_LINE_LAYER_ID,
      type: 'line',
      source: BARANGAY_SOURCE_ID,
      paint: { 'line-color': ['get', '__color'], 'line-width': 2, 'line-opacity': 0.95 },
    } as LayerSpecification)

    barangayHoverCleanup = engine.enableHoverCursor(BARANGAY_FILL_LAYER_ID)

    barangayMoveCleanup = engine.on('mousemove', BARANGAY_FILL_LAYER_ID, (event) => {
      const feature = event.features?.[0]
      if (!feature || !engine) {
        return
      }
      const label = String(feature.properties?.__label ?? '')
      engine.openPopup(
        BARANGAY_POPUP_ID,
        event.lngLat,
        buildHtmlFromNode((container) => {
          container.className = 'map-info-window'
          container.textContent = label
        }),
        { closeButton: false, closeOnClick: false },
      )
    })

    barangayLeaveCleanup = engine.on('mouseleave', BARANGAY_FILL_LAYER_ID, () => {
      engine?.closePopup(BARANGAY_POPUP_ID)
    })
  }

  async function renderMappedZones(mappedZones: MappedZone[]): Promise<void> {
    lastMappedZones = mappedZones
    removeMappedZonesLayers()

    const validZones = mappedZones.filter((zone) => zone.points.length >= 3)

    if (!engine || validZones.length === 0) {
      return
    }

    const featureCollection = {
      type: 'FeatureCollection',
      features: validZones.map((zone) => ({
        type: 'Feature',
        properties: { name: zone.name, zoning_title: zone.zoning_title, color: zone.zoning_color },
        geometry: {
          type: 'Polygon',
          coordinates: [zone.points.map((point) => [point.lng, point.lat])],
        },
      })),
    }

    engine.addGeoJsonSource(
      MAPPED_ZONES_SOURCE_ID,
      featureCollection as GeoJSONSourceSpecification['data'],
    )

    engine.addLayer({
      id: MAPPED_ZONES_FILL_LAYER_ID,
      type: 'fill',
      source: MAPPED_ZONES_SOURCE_ID,
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.22 },
    } as LayerSpecification)

    engine.addLayer({
      id: MAPPED_ZONES_LINE_LAYER_ID,
      type: 'line',
      source: MAPPED_ZONES_SOURCE_ID,
      paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-opacity': 0.95 },
    } as LayerSpecification)

    mappedZonesClickCleanup = engine.on('click', MAPPED_ZONES_FILL_LAYER_ID, (event) => {
      if (isDrawMode) {
        return
      }

      const feature = event.features?.[0]
      if (!feature || !engine) {
        return
      }

      const name = String(feature.properties?.name ?? '')
      const title = String(feature.properties?.zoning_title ?? '')

      engine.openPopup(
        MAPPED_ZONES_POPUP_ID,
        event.lngLat,
        buildHtmlFromNode((container) => {
          const strong = document.createElement('strong')
          strong.textContent = name
          container.append(strong, document.createElement('br'), document.createTextNode(title))
        }),
      )
    })
  }

  async function renderHazards(showHazards: boolean, hazards: Hazard[]): Promise<void> {
    lastHazardsArgs = [showHazards, hazards]
    removeHazardsLayers()

    if (!engine || !showHazards || hazards.length === 0) {
      return
    }

    const featureCollection = {
      type: 'FeatureCollection',
      features: hazards.map((hazard) => ({
        type: 'Feature',
        properties: { id: hazard.id, name: hazard.name, severity: hazard.severity },
        geometry: hazard.geometry,
      })),
    }

    engine.addGeoJsonSource(
      HAZARDS_SOURCE_ID,
      featureCollection as GeoJSONSourceSpecification['data'],
    )

    engine.addLayer({
      id: HAZARDS_POLYGON_LAYER_ID,
      type: 'fill',
      source: HAZARDS_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.2 },
    } as LayerSpecification)

    engine.addLayer({
      id: HAZARDS_POLYGON_OUTLINE_LAYER_ID,
      type: 'line',
      source: HAZARDS_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'line-color': '#ef4444', 'line-width': 2 },
    } as LayerSpecification)

    engine.addLayer({
      id: HAZARDS_LINE_LAYER_ID,
      type: 'line',
      source: HAZARDS_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': '#f97316', 'line-width': 3 },
    } as LayerSpecification)

    engine.addLayer({
      id: HAZARDS_POINT_LAYER_ID,
      type: 'circle',
      source: HAZARDS_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 7,
        'circle-color': '#ef4444',
        'circle-opacity': 0.35,
        'circle-stroke-color': '#ef4444',
        'circle-stroke-width': 2,
      },
    } as LayerSpecification)

    hazardsClickCleanup = engine.on(
      'click',
      [HAZARDS_POLYGON_LAYER_ID, HAZARDS_LINE_LAYER_ID, HAZARDS_POINT_LAYER_ID],
      (event) => {
        const feature = event.features?.[0]
        if (!feature || !engine) {
          return
        }

        const name = String(feature.properties?.name ?? '')
        const severity = String(feature.properties?.severity ?? '')

        engine.openPopup(
          HAZARDS_POPUP_ID,
          event.lngLat,
          buildHtmlFromNode((container) => {
            const strong = document.createElement('strong')
            strong.textContent = name
            const meta = document.createElement('div')
            meta.textContent = severity
            container.append(strong, meta)
          }),
        )
      },
    )
  }

  async function renderDrawPreview(drawPoints: MapDrawPoint[]): Promise<void> {
    lastDrawPoints = drawPoints
    removeDrawPreviewLayers()

    if (!engine || drawPoints.length === 0) {
      return
    }

    const positions = drawPoints.map((point) => [point.lng, point.lat])

    if (drawPoints.length >= 3) {
      engine.addGeoJsonSource(DRAW_PREVIEW_SOURCE_ID, {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [positions] },
      } as GeoJSONSourceSpecification['data'])

      engine.addLayer({
        id: DRAW_PREVIEW_FILL_LAYER_ID,
        type: 'fill',
        source: DRAW_PREVIEW_SOURCE_ID,
        paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.16 },
      } as LayerSpecification)

      engine.addLayer({
        id: DRAW_PREVIEW_LINE_LAYER_ID,
        type: 'line',
        source: DRAW_PREVIEW_SOURCE_ID,
        paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [2, 2] },
      } as LayerSpecification)
    } else if (drawPoints.length >= 2) {
      engine.addGeoJsonSource(DRAW_PREVIEW_SOURCE_ID, {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: positions },
      } as GeoJSONSourceSpecification['data'])

      engine.addLayer({
        id: DRAW_PREVIEW_LINE_LAYER_ID,
        type: 'line',
        source: DRAW_PREVIEW_SOURCE_ID,
        paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [2, 2] },
      } as LayerSpecification)
    }

    drawPoints.forEach((point, index) => {
      const element = document.createElement('span')
      element.style.display = 'block'
      element.style.width = '10px'
      element.style.height = '10px'
      element.style.borderRadius = '9999px'
      element.style.background = '#3b82f6'
      element.style.border = '1px solid #1d4ed8'

      const markerId = `${DRAW_PREVIEW_VERTEX_ID_PREFIX}${index}`
      const marker = engine?.addMarker(markerId, [point.lng, point.lat], {
        element,
        draggable: Boolean(isDrawMode && drawPointMoveHandler),
      })

      if (!marker) {
        return
      }

      drawPreviewVertexIds.push(markerId)

      if (isDrawMode && drawPointMoveHandler) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          drawPointMoveHandler?.(index, { lat: lngLat.lat, lng: lngLat.lng })
        })
      }
    })
  }

  function reapplyOverlays(): void {
    if (lastBarangayArgs) {
      void renderBarangayBorders(...lastBarangayArgs)
    }
    if (lastMappedZones) {
      void renderMappedZones(lastMappedZones)
    }
    if (lastHazardsArgs) {
      void renderHazards(...lastHazardsArgs)
    }
    if (lastDrawPoints) {
      void renderDrawPreview(lastDrawPoints)
    }
    if (lastPins) {
      void renderPinnedLocations(lastPins.pins, lastPins.handler)
    }
  }

  async function focusOnZone(points: MapDrawPoint[]): Promise<void> {
    if (!engine || points.length === 0) {
      return
    }

    const center = points.reduce(
      (accumulator, point) => ({
        lat: accumulator.lat + point.lat,
        lng: accumulator.lng + point.lng,
      }),
      { lat: 0, lng: 0 },
    )

    engine.setCenter(
      { lat: center.lat / points.length, lng: center.lng / points.length },
      16,
    )
  }

  async function showLocationMarker(
    point: { lat: number; lng: number },
    label?: string,
  ): Promise<void> {
    if (!engine) {
      return
    }

    destroyFocusMarker()

    engine.addMarker(FOCUS_MARKER_ID, [point.lng, point.lat], { color: '#2563eb' })

    if (label) {
      engine.openPopup(
        FOCUS_POPUP_ID,
        [point.lng, point.lat],
        buildHtmlFromNode((container) => {
          const strong = document.createElement('strong')
          strong.textContent = label
          container.append(strong)
        }),
      )
    }

    engine.flyTo(point, { zoom: 17, duration: 800 })
  }

  async function renderPinnedLocations(
    pins: MapPinMarker[],
    onPinClick?: PinClickHandler | null,
  ): Promise<void> {
    const handler = onPinClick ?? null
    lastPins = { pins, handler }
    destroyPinMarkers()

    if (!engine) {
      return
    }

    pins.forEach((pin) => {
      const markerId = `${PIN_MARKER_ID_PREFIX}${pin.id}`
      const el = document.createElement('img')
      el.src = createPinIconSrc()
      el.alt = pin.title
      el.style.width = '28px'
      el.style.height = '40px'
      el.style.cursor = 'pointer'
      const marker = engine?.addMarker(markerId, [pin.lng, pin.lat], {
        element: el,
        anchor: 'bottom',
      }) as Marker | null

      if (!marker) {
        return
      }

      const popup = new MapLibrePopup({
        offset: 36,
        closeButton: false,
        closeOnClick: true,
        className: PIN_POPUP_CLASS,
        maxWidth: '300px',
      }).setHTML(buildPinPopupHtml(pin))
      marker.setPopup(popup)

      pinMarkerIds.push(markerId)
      marker.getElement().addEventListener('click', () => {
        handler?.(pin.id)
      })
    })
  }

  return {
    init,
    destroy,
    setCenter,
    renderBarangayBorders,
    renderMappedZones,
    renderHazards,
    renderDrawPreview,
    setMapClickHandler,
    setFreehandDrawHandler,
    setDrawMode,
    setTheme,
    getPoiTypes,
    setPoiTypeVisible,
    setDrawPointMoveHandler,
    setCameraIdleHandler,
    focusOnZone,
    showLocationMarker,
    clearFocusMarker: destroyFocusMarker,
    renderPinnedLocations,
  }
}
