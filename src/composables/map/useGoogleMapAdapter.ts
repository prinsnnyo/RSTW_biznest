import type { Ref } from 'vue'
import type { BarangayFeatureCollection } from '@/types/map.types'
import type { Hazard } from '@/types/hazard.types'
import type { MapDrawPoint, MappedZone } from '@/types/zoning.types'
import type {
  GoogleMapStyleRule,
  GoogleInfoWindowInstance,
  GoogleLatLng,
  GoogleMapInstance,
  GoogleMarkerInstance,
  GoogleMapsEventListener,
  GooglePolygonInstance,
  GooglePolylineInstance,
  GoogleWindow,
} from '@/types/google-map-adapter.types'
import {
  delay,
  initializeGoogleMapInstance,
  loadGoogleMapsScript,
} from '@/composables/map/googleMapAdapter.init'
import {
  buildMapInfoWindowHtml,
  getBarangayLabel,
  getBorderColor,
  getFeaturePolygons,
  toGooglePath,
} from '@/utils/map/barangayBorder.utils'

interface GoogleAdapterOptions {
  containerRef: Ref<HTMLDivElement | null>
  center: { lat: number; lng: number }
  mapId?: string
  getApiKey: () => string
}

type MapClickHandler = (point: MapDrawPoint) => void
type DrawPointMoveHandler = (index: number, point: MapDrawPoint) => void
type MapThemeMode = 'light' | 'dark'

const GOOGLE_DARK_STYLES: GoogleMapStyleRule[] = [
  { elementType: 'geometry', stylers: [{ color: '#1f2a44' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#e5e7eb' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3f4f72' }],
  },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1a243a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#273453' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#2d5b3f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#384b6f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f3b5f' }] },
]

const GOOGLE_HIDE_POI_STYLES: GoogleMapStyleRule[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

const DRAW_MODE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 20l4-1 9.5-9.5-3-3L5 16z' fill='%231f2937'/%3E%3Cpath d='M14.5 6.5l3 3 1-1a1.6 1.6 0 000-2.2l-.8-.8a1.6 1.6 0 00-2.2 0z' fill='%230f172a'/%3E%3C/svg%3E\") 2 20, crosshair"

export function useGoogleMapAdapter(options: GoogleAdapterOptions) {
  let googleMapsLoader: Promise<void> | null = null
  let googleMap: GoogleMapInstance | null = null
  let googleBarangayPolygons: GooglePolygonInstance[] = []
  let googleMappedZonePolygons: GooglePolygonInstance[] = []
  let googleHazardPolygons: GooglePolygonInstance[] = []
  let googleHazardPolylines: GooglePolylineInstance[] = []
  let googleHazardMarkers: GoogleMarkerInstance[] = []
  let googleBarangayInfoWindow: GoogleInfoWindowInstance | null = null
  let googleDrawPreviewPolygon: GooglePolygonInstance | null = null
  let googleDrawPreviewPolyline: GooglePolylineInstance | null = null
  let googleDrawPreviewVertices: GoogleMarkerInstance[] = []
  let googleMapClickListener: GoogleMapsEventListener | null = null
  let mapClickHandler: MapClickHandler | null = null
  let drawPointMoveHandler: DrawPointMoveHandler | null = null
  let isDrawMode = false
  let currentTheme: MapThemeMode = 'light'
  let showPoi = false

  function applyGoogleTheme(): void {
    if (!googleMap || !googleMap.setOptions) {
      return
    }

    const baseStyles = currentTheme === 'dark' ? GOOGLE_DARK_STYLES : []
    const poiStyles = showPoi ? [] : GOOGLE_HIDE_POI_STYLES
    googleMap.setOptions({ styles: [...baseStyles, ...poiStyles] })
  }

  function applyGoogleCursor(): void {
    if (!googleMap) {
      return
    }

    googleMap.getDiv().style.cursor = isDrawMode ? DRAW_MODE_CURSOR : ''

    if (googleMap.setOptions) {
      googleMap.setOptions({
        draggableCursor: isDrawMode ? DRAW_MODE_CURSOR : null,
      })
    }
  }

  function destroyGoogleBarangayPolygons(): void {
    googleBarangayPolygons.forEach((polygon) => polygon.setMap(null))
    googleBarangayPolygons = []

    if (googleBarangayInfoWindow) {
      googleBarangayInfoWindow.close()
    }
  }

  function destroyGoogleMappedZonePolygons(): void {
    googleMappedZonePolygons.forEach((polygon) => polygon.setMap(null))
    googleMappedZonePolygons = []
  }

  function destroyGoogleHazards(): void {
    googleHazardPolygons.forEach((polygon) => polygon.setMap(null))
    googleHazardPolylines.forEach((polyline) => polyline.setMap(null))
    googleHazardMarkers.forEach((marker) => marker.setMap(null))
    googleHazardPolygons = []
    googleHazardPolylines = []
    googleHazardMarkers = []
  }

  function destroyGoogleDrawPreview(): void {
    googleDrawPreviewPolygon?.setMap(null)
    googleDrawPreviewPolygon = null
    googleDrawPreviewPolyline?.setMap(null)
    googleDrawPreviewPolyline = null
    googleDrawPreviewVertices.forEach((marker) => marker.setMap(null))
    googleDrawPreviewVertices = []
  }

  function clearGoogleMapClickListener(): void {
    googleMapClickListener?.remove()
    googleMapClickListener = null
  }

  function syncGoogleMapClickListener(): void {
    clearGoogleMapClickListener()

    if (!googleMap || !googleMap.addListener || !mapClickHandler) {
      return
    }

    googleMapClickListener = googleMap.addListener('click', (event) => {
      if (!event.latLng) {
        return
      }

      mapClickHandler?.({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      })
    })
  }

  function destroy(): void {
    destroyGoogleBarangayPolygons()
    destroyGoogleMappedZonePolygons()
    destroyGoogleHazards()
    destroyGoogleDrawPreview()
    clearGoogleMapClickListener()

    if (googleMap) {
      googleMap.getDiv().style.cursor = ''
    }

    googleMap = null
  }

  function openGoogleBarangayInfoWindow(label: string, latLng?: GoogleLatLng): void {
    if (!googleMap || !googleBarangayInfoWindow) {
      return
    }

    if (latLng) {
      googleBarangayInfoWindow.setPosition({ lat: latLng.lat(), lng: latLng.lng() })
    }

    googleBarangayInfoWindow.setContent(buildMapInfoWindowHtml(label))
    googleBarangayInfoWindow.open({ map: googleMap })
  }

  async function renderBarangayBorders(
    showBarangayBorders: boolean,
    barangayBorders: BarangayFeatureCollection | null,
  ): Promise<void> {
    destroyGoogleBarangayPolygons()

    if (!googleMap || !showBarangayBorders || !barangayBorders) {
      return
    }

    const googleMaps = (window as GoogleWindow).google?.maps
    if (!googleMaps?.Polygon) {
      return
    }

    const PolygonCtor = googleMaps.Polygon

    if (googleMaps.InfoWindow && !googleBarangayInfoWindow) {
      googleBarangayInfoWindow = new googleMaps.InfoWindow()
    }

    barangayBorders.features.forEach((feature, featureIndex) => {
      const borderColor = getBorderColor(featureIndex)
      const label = getBarangayLabel(feature, featureIndex)

      getFeaturePolygons(feature).forEach((polygonRings) => {
        const paths = polygonRings.map((ring) => toGooglePath(ring))

        const polygon = new PolygonCtor({
          paths,
          strokeColor: borderColor,
          strokeOpacity: 0.95,
          strokeWeight: 2,
          fillColor: borderColor,
          fillOpacity: 0.1,
          map: googleMap as GoogleMapInstance,
        })

        if (polygon.addListener) {
          polygon.addListener('mouseover', (event) => {
            openGoogleBarangayInfoWindow(label, event.latLng)
          })

          polygon.addListener('click', (event) => {
            openGoogleBarangayInfoWindow(label, event.latLng)
          })

          polygon.addListener('mouseout', () => {
            if (googleBarangayInfoWindow) {
              googleBarangayInfoWindow.close()
            }
          })
        }

        googleBarangayPolygons.push(polygon)
      })
    })
  }

  async function renderMappedZones(mappedZones: MappedZone[]): Promise<void> {
    destroyGoogleMappedZonePolygons()

    if (!googleMap || mappedZones.length === 0) {
      return
    }

    const googleMaps = (window as GoogleWindow).google?.maps
    if (!googleMaps?.Polygon) {
      return
    }

    const PolygonCtor = googleMaps.Polygon

    mappedZones.forEach((zone) => {
      if (zone.points.length < 3) {
        return
      }

      const polygon = new PolygonCtor({
        paths: [zone.points.map((point) => ({ lat: point.lat, lng: point.lng }))],
        strokeColor: zone.zoning_color,
        strokeOpacity: 0.95,
        strokeWeight: 2,
        fillColor: zone.zoning_color,
        fillOpacity: 0.22,
        map: googleMap as GoogleMapInstance,
      })

      googleMappedZonePolygons.push(polygon)
    })
  }

  async function renderDrawPreview(drawPoints: MapDrawPoint[]): Promise<void> {
    destroyGoogleDrawPreview()

    if (!googleMap || drawPoints.length === 0) {
      return
    }

    const googleMaps = (window as GoogleWindow).google?.maps
    if (!googleMaps) {
      return
    }

    const MarkerCtor = googleMaps.Marker
    if (MarkerCtor) {
      googleDrawPreviewVertices = drawPoints.map((point, index) => {
        const marker = new MarkerCtor({
          position: { lat: point.lat, lng: point.lng },
          map: googleMap as GoogleMapInstance,
          draggable: Boolean(isDrawMode && drawPointMoveHandler),
          zIndex: 999,
          icon: {
            path: 'M 0,0 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0',
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#1d4ed8',
            strokeOpacity: 1,
            strokeWeight: 1,
            scale: 1,
          },
        })

        if (isDrawMode && drawPointMoveHandler && marker.addListener) {
          marker.addListener('dragend', (event) => {
            if (!event.latLng) {
              return
            }

            drawPointMoveHandler?.(index, {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            })
          })
        }

        return marker
      })
    }

    if (drawPoints.length < 2) {
      return
    }

    if (drawPoints.length >= 3 && googleMaps.Polygon) {
      googleDrawPreviewPolygon = new googleMaps.Polygon({
        paths: [drawPoints.map((point) => ({ lat: point.lat, lng: point.lng }))],
        strokeColor: '#2563eb',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#2563eb',
        fillOpacity: 0.16,
        map: googleMap as GoogleMapInstance,
      })
      return
    }

    if (googleMaps.Polyline) {
      googleDrawPreviewPolyline = new googleMaps.Polyline({
        path: drawPoints.map((point) => ({ lat: point.lat, lng: point.lng })),
        strokeColor: '#2563eb',
        strokeOpacity: 1,
        strokeWeight: 2,
        map: googleMap as GoogleMapInstance,
      })
    }
  }

  async function renderHazards(showHazards: boolean, hazards: Hazard[]): Promise<void> {
    destroyGoogleHazards()

    if (!googleMap || !showHazards || hazards.length === 0) {
      return
    }

    const googleMaps = (window as GoogleWindow).google?.maps
    if (!googleMaps) {
      return
    }

    const MarkerCtor = googleMaps.Marker
    const PolygonCtor = googleMaps.Polygon
    const PolylineCtor = googleMaps.Polyline

    hazards.forEach((hazard) => {
      if (hazard.geometry.type === 'Point' && MarkerCtor) {
        const [lng, lat] = hazard.geometry.coordinates

        const marker = new MarkerCtor({
          position: { lat, lng },
          map: googleMap as GoogleMapInstance,
          title: hazard.name,
          icon: {
            path: 'M 0,0 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0',
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#7f1d1d',
            strokeOpacity: 1,
            strokeWeight: 1,
            scale: 1,
          },
        })

        googleHazardMarkers.push(marker)
        return
      }

      if (hazard.geometry.type === 'LineString' && PolylineCtor) {
        const polyline = new PolylineCtor({
          path: hazard.geometry.coordinates.map((point) => ({ lat: point[1], lng: point[0] })),
          strokeColor: '#f97316',
          strokeOpacity: 1,
          strokeWeight: 3,
          map: googleMap as GoogleMapInstance,
        })

        googleHazardPolylines.push(polyline)
        return
      }

      if (hazard.geometry.type === 'Polygon' && PolygonCtor) {
        const polygon = new PolygonCtor({
          paths: hazard.geometry.coordinates.map((ring) =>
            ring.map((point) => ({ lat: point[1], lng: point[0] })),
          ),
          strokeColor: '#ef4444',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#ef4444',
          fillOpacity: 0.2,
          map: googleMap as GoogleMapInstance,
        })

        googleHazardPolygons.push(polygon)
      }
    })
  }

  function setMapClickHandler(handler: MapClickHandler | null): void {
    mapClickHandler = handler
    syncGoogleMapClickListener()
  }

  function setDrawPointMoveHandler(handler: DrawPointMoveHandler | null): void {
    drawPointMoveHandler = handler
  }

  function setDrawMode(enabled: boolean): void {
    isDrawMode = enabled
    applyGoogleCursor()
  }

  function setTheme(theme: MapThemeMode): void {
    currentTheme = theme
    applyGoogleTheme()
  }

  function setPoisVisible(visible: boolean): void {
    showPoi = visible
    applyGoogleTheme()
  }

  async function focusOnZone(points: MapDrawPoint[]): Promise<void> {
    if (!googleMap || points.length === 0) {
      return
    }

    const center = points.reduce(
      (accumulator, point) => {
        return {
          lat: accumulator.lat + point.lat,
          lng: accumulator.lng + point.lng,
        }
      },
      { lat: 0, lng: 0 },
    )

    const lat = center.lat / points.length
    const lng = center.lng / points.length

    googleMap.setCenter({ lat, lng })
    googleMap.setZoom?.(16)
  }

  function setCenter(center: { lat: number; lng: number }, zoom = 14): void {
    if (!googleMap) {
      return
    }

    googleMap.setCenter(center)
    googleMap.setZoom?.(zoom)
  }

  function loadGoogleMaps(): Promise<void> {
    const resolvedGoogleMapsApiKey = options.getApiKey()

    googleMapsLoader = loadGoogleMapsScript(resolvedGoogleMapsApiKey, googleMapsLoader)

    return googleMapsLoader.then(() => {
      const googleWindow = window as GoogleWindow
      if (googleWindow.__googleMapsAuthFailed) {
        throw new Error(
          'Google Maps authentication failed. Verify API key, billing, and allowed referrers.',
        )
      }
    })
  }

  async function initializeMapInstance(): Promise<boolean> {
    return initializeGoogleMapInstance({
      container: options.containerRef.value,
      center: options.center,
      mapId: options.mapId,
      onMapReady: (map) => {
        googleMap = map
        syncGoogleMapClickListener()
        applyGoogleCursor()
        applyGoogleTheme()
      },
    })
  }

  async function init(): Promise<void> {
    await loadGoogleMaps()

    let initialized = false

    for (let attempt = 0; attempt < 6 && !initialized; attempt += 1) {
      initialized = await initializeMapInstance()

      if (!initialized) {
        await delay(200)
      }
    }

    if (!initialized) {
      throw new Error(
        'Google Maps could not be initialized. Check API key and Google Cloud restrictions.',
      )
    }
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
    setDrawMode,
    setTheme,
    setPoisVisible,
    setDrawPointMoveHandler,
    focusOnZone,
  }
}
