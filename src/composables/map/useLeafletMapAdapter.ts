import type { Ref } from 'vue'
import type {
  LayerGroup as LeafletLayerGroup,
  LeafletMouseEvent,
  Map as LeafletMap,
  Marker as LeafletMarker,
  TileLayer as LeafletTileLayer,
} from 'leaflet'
import type { BarangayFeatureCollection } from '@/types/map.types'
import type { Hazard } from '@/types/hazard.types'
import type { MapDrawPoint, MappedZone } from '@/types/zoning.types'
import type { MapPinMarker } from '@/types/pinned-location.types'
import {
  getBarangayLabel,
  getBorderColor,
  getFeaturePolygons,
  toLeafletLatLngRings,
} from '@/utils/map/barangayBorder.utils'
import { createPinIconSrc } from '@/utils/pin-icon.utils'
import { buildPinPopupHtml, PIN_POPUP_CLASS } from '@/utils/map/pinPopup.utils'

interface LeafletAdapterOptions {
  containerRef: Ref<HTMLDivElement | null>
  center: { lat: number; lng: number }
}

type MapClickHandler = (point: MapDrawPoint) => void
type DrawPointMoveHandler = (index: number, point: MapDrawPoint) => void
type PinClickHandler = (pinId: string) => void
type MapThemeMode = 'light' | 'dark'

const LEAFLET_DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const LEAFLET_NO_POI_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png'
const LEAFLET_DARK_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
const LEAFLET_DARK_NO_POI_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png'
const LEAFLET_LIGHT_ATTRIBUTION = '&copy; OpenStreetMap contributors'
const LEAFLET_DARK_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO'

const DRAW_MODE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 20l4-1 9.5-9.5-3-3L5 16z' fill='%231f2937'/%3E%3Cpath d='M14.5 6.5l3 3 1-1a1.6 1.6 0 000-2.2l-.8-.8a1.6 1.6 0 00-2.2 0z' fill='%230f172a'/%3E%3C/svg%3E\") 2 20, crosshair"

export function useLeafletMapAdapter(options: LeafletAdapterOptions) {
  let leafletMap: LeafletMap | null = null
  let leafletBaseTiles: LeafletTileLayer | null = null
  let leafletBarangayLayer: LeafletLayerGroup | null = null
  let leafletMappedZonesLayer: LeafletLayerGroup | null = null
  let leafletHazardsLayer: LeafletLayerGroup | null = null
  let leafletDrawPreviewLayer: LeafletLayerGroup | null = null
  let leafletFocusMarkerLayer: LeafletLayerGroup | null = null
  let leafletPinnedLocationsLayer: LeafletLayerGroup | null = null
  const leafletPinMarkers = new Map<string, LeafletMarker>()
  let mapClickHandler: MapClickHandler | null = null
  let drawPointMoveHandler: DrawPointMoveHandler | null = null
  let pinClickHandler: PinClickHandler | null = null
  let leafletClickListener: ((event: LeafletMouseEvent) => void) | null = null
  let isDrawMode = false
  let currentTheme: MapThemeMode = 'light'
  let showPoi = false

  async function applyLeafletTheme(): Promise<void> {
    if (!leafletMap) {
      return
    }

    const L = await import('leaflet')

    if (leafletBaseTiles) {
      leafletBaseTiles.remove()
      leafletBaseTiles = null
    }

    let tileUrl: string
    let attribution: string

    if (currentTheme === 'dark') {
      tileUrl = showPoi ? LEAFLET_DARK_TILE_URL : LEAFLET_DARK_NO_POI_TILE_URL
      attribution = LEAFLET_DARK_ATTRIBUTION
    } else {
      tileUrl = showPoi ? LEAFLET_DEFAULT_TILE_URL : LEAFLET_NO_POI_TILE_URL
      attribution = showPoi ? LEAFLET_LIGHT_ATTRIBUTION : LEAFLET_DARK_ATTRIBUTION
    }

    leafletBaseTiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
    })

    leafletBaseTiles.addTo(leafletMap)

    // Dark mode uses a softer visual filter to keep map colors readable.
    const mapContainer = leafletMap.getContainer()
    mapContainer.classList.toggle('leaflet-theme-dark', currentTheme === 'dark')
  }

  function applyLeafletCursor(): void {
    if (!leafletMap) {
      return
    }

    const container = leafletMap.getContainer()
    container.style.cursor = isDrawMode ? DRAW_MODE_CURSOR : ''
  }

  async function init(): Promise<void> {
    if (!options.containerRef.value) {
      return
    }

    const L = await import('leaflet')

    leafletMap = L.map(options.containerRef.value, { zoomControl: false }).setView(
      [options.center.lat, options.center.lng],
      14,
    )

    leafletMap.attributionControl.setPrefix(false)

    L.control.zoom({ position: 'topleft' }).addTo(leafletMap)

    await applyLeafletTheme()

    applyLeafletCursor()
  }

  function setCenter(center: { lat: number; lng: number }, zoom = 14): void {
    if (!leafletMap) {
      return
    }

    leafletMap.setView([center.lat, center.lng], zoom)
  }

  function destroyLeafletBarangayLayer(): void {
    if (leafletBarangayLayer) {
      leafletBarangayLayer.remove()
      leafletBarangayLayer = null
    }
  }

  function destroyLeafletMappedZonesLayer(): void {
    if (leafletMappedZonesLayer) {
      leafletMappedZonesLayer.remove()
      leafletMappedZonesLayer = null
    }
  }

  function destroyLeafletHazardsLayer(): void {
    if (leafletHazardsLayer) {
      leafletHazardsLayer.remove()
      leafletHazardsLayer = null
    }
  }

  function destroyLeafletDrawPreviewLayer(): void {
    if (leafletDrawPreviewLayer) {
      leafletDrawPreviewLayer.remove()
      leafletDrawPreviewLayer = null
    }
  }

  function destroyLeafletFocusMarkerLayer(): void {
    if (leafletFocusMarkerLayer) {
      leafletFocusMarkerLayer.remove()
      leafletFocusMarkerLayer = null
    }
  }

  function destroyLeafletPinnedLocationsLayer(): void {
    if (leafletPinnedLocationsLayer) {
      leafletPinnedLocationsLayer.remove()
      leafletPinnedLocationsLayer = null
    }
    leafletPinMarkers.clear()
  }

  function clearLeafletClickListener(): void {
    if (leafletMap && leafletClickListener) {
      leafletMap.off('click', leafletClickListener)
      leafletClickListener = null
    }
  }

  function destroy(): void {
    destroyLeafletBarangayLayer()
    destroyLeafletMappedZonesLayer()
    destroyLeafletHazardsLayer()
    destroyLeafletDrawPreviewLayer()
    destroyLeafletFocusMarkerLayer()
    destroyLeafletPinnedLocationsLayer()
    clearLeafletClickListener()

    if (leafletBaseTiles) {
      leafletBaseTiles.remove()
      leafletBaseTiles = null
    }

    if (leafletMap) {
      leafletMap.getContainer().classList.remove('leaflet-theme-dark')
      leafletMap.getContainer().style.cursor = ''
      leafletMap.remove()
      leafletMap = null
    }
  }

  function setDrawMode(enabled: boolean): void {
    isDrawMode = enabled
    applyLeafletCursor()
  }

  function setTheme(theme: MapThemeMode): void {
    currentTheme = theme
    void applyLeafletTheme()
  }

  function setPoisVisible(visible: boolean): void {
    showPoi = visible
    void applyLeafletTheme()
  }

  function setDrawPointMoveHandler(handler: DrawPointMoveHandler | null): void {
    drawPointMoveHandler = handler
  }

  async function renderBarangayBorders(
    showBarangayBorders: boolean,
    barangayBorders: BarangayFeatureCollection | null,
  ): Promise<void> {
    if (!leafletMap) {
      return
    }

    destroyLeafletBarangayLayer()

    if (!showBarangayBorders || !barangayBorders) {
      return
    }

    const L = await import('leaflet')
    const layerGroup = L.layerGroup()

    barangayBorders.features.forEach((feature, featureIndex) => {
      const borderColor = getBorderColor(featureIndex)
      const label = getBarangayLabel(feature, featureIndex)

      getFeaturePolygons(feature).forEach((polygonRings) => {
        const latLngRings = toLeafletLatLngRings(polygonRings)

        L.polygon(latLngRings, {
          color: borderColor,
          weight: 2,
          opacity: 0.95,
          fillColor: borderColor,
          fillOpacity: 0.1,
        })
          .bindTooltip(label, {
            className: 'map-info-tooltip',
            sticky: true,
          })
          .addTo(layerGroup)
      })
    })

    layerGroup.addTo(leafletMap)
    leafletBarangayLayer = layerGroup
  }

  async function renderMappedZones(mappedZones: MappedZone[]): Promise<void> {
    if (!leafletMap) {
      return
    }

    destroyLeafletMappedZonesLayer()

    const L = await import('leaflet')
    const layerGroup = L.layerGroup()

    mappedZones.forEach((zone) => {
      if (zone.points.length < 3) {
        return
      }

      L.polygon(
        zone.points.map((point) => [point.lat, point.lng] as [number, number]),
        {
          color: zone.zoning_color,
          weight: 2,
          opacity: 0.95,
          fillColor: zone.zoning_color,
          fillOpacity: 0.22,
          interactive: !isDrawMode,
        },
      )
        .bindPopup(`<strong>${zone.name}</strong><br/>${zone.zoning_title}`)
        .addTo(layerGroup)
    })

    layerGroup.addTo(leafletMap)
    leafletMappedZonesLayer = layerGroup
  }

  async function renderDrawPreview(drawPoints: MapDrawPoint[]): Promise<void> {
    if (!leafletMap) {
      return
    }

    destroyLeafletDrawPreviewLayer()

    if (drawPoints.length === 0) {
      return
    }

    const L = await import('leaflet')
    const layerGroup = L.layerGroup()
    const positions = drawPoints.map((point) => [point.lat, point.lng] as [number, number])

    if (drawPoints.length >= 3) {
      L.polygon(positions, {
        color: '#2563eb',
        weight: 2,
        fillColor: '#2563eb',
        fillOpacity: 0.16,
        dashArray: '5, 5',
        interactive: false,
      }).addTo(layerGroup)
    } else if (drawPoints.length >= 2) {
      L.polyline(positions, {
        color: '#2563eb',
        weight: 2,
        dashArray: '5, 5',
        interactive: false,
      }).addTo(layerGroup)
    }

    positions.forEach((position, index) => {
      const marker = L.marker(position, {
        draggable: Boolean(isDrawMode && drawPointMoveHandler),
        icon: L.divIcon({
          className: '',
          html: '<span style="display:block;width:10px;height:10px;border-radius:9999px;background:#3b82f6;border:1px solid #1d4ed8;"></span>',
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
      }).addTo(layerGroup)

      if (isDrawMode && drawPointMoveHandler) {
        marker.on('dragend', () => {
          const latLng = marker.getLatLng()
          drawPointMoveHandler?.(index, {
            lat: latLng.lat,
            lng: latLng.lng,
          })
        })
      }
    })

    layerGroup.addTo(leafletMap)
    leafletDrawPreviewLayer = layerGroup
  }

  async function renderHazards(showHazards: boolean, hazards: Hazard[]): Promise<void> {
    if (!leafletMap) {
      return
    }

    destroyLeafletHazardsLayer()

    if (!showHazards || hazards.length === 0) {
      return
    }

    const L = await import('leaflet')
    const layerGroup = L.layerGroup()

    hazards.forEach((hazard) => {
      const buildPopupContent = (): HTMLDivElement => {
        const container = document.createElement('div')
        const title = document.createElement('strong')
        title.textContent = hazard.name
        const meta = document.createElement('div')
        meta.textContent = hazard.severity
        container.append(title, document.createElement('br'), meta)
        return container
      }

      const toLatLng = (point: [number, number]) => [point[1], point[0]] as [number, number]
      const geometry = hazard.geometry
      if (!geometry) {
        return
      }

      const addMarker = (point: [number, number]): void => {
        L.circleMarker(toLatLng(point), {
          radius: 7,
          color: '#ef4444',
          weight: 2,
          fillColor: '#ef4444',
          fillOpacity: 0.35,
        })
          .bindPopup(buildPopupContent)
          .addTo(layerGroup)
      }

      if (geometry.type === 'Point') {
        addMarker(geometry.coordinates)
        return
      }

      if (geometry.type === 'MultiPoint') {
        geometry.coordinates.forEach(addMarker)
        return
      }

      if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
        // Leaflet's polyline() natively accepts either a single path
        // (LatLng[]) or multiple disjoint paths (LatLng[][]) — both shapes
        // line up with GeoJSON's LineString/MultiLineString coordinates.
        L.polyline(
          geometry.type === 'LineString'
            ? geometry.coordinates.map(toLatLng)
            : geometry.coordinates.map((line) => line.map(toLatLng)),
          {
            color: '#f97316',
            weight: 3,
            opacity: 0.95,
          },
        )
          .bindPopup(buildPopupContent)
          .addTo(layerGroup)
        return
      }

      // Same deal for polygon() — LatLng[][] (rings) or LatLng[][][]
      // (multi-polygon parts, each with its own rings) both work natively.
      L.polygon(
        geometry.type === 'Polygon'
          ? geometry.coordinates.map((ring) => ring.map(toLatLng))
          : geometry.coordinates.map((rings) => rings.map((ring) => ring.map(toLatLng))),
        {
          color: '#ef4444',
          weight: 2,
          opacity: 0.95,
          fillColor: '#ef4444',
          fillOpacity: 0.2,
        },
      )
        .bindPopup(buildPopupContent)
        .addTo(layerGroup)
    })

    layerGroup.addTo(leafletMap)
    leafletHazardsLayer = layerGroup
  }

  function setMapClickHandler(handler: MapClickHandler | null): void {
    mapClickHandler = handler
    clearLeafletClickListener()

    if (!leafletMap || !mapClickHandler) {
      return
    }

    leafletClickListener = (event) => {
      mapClickHandler?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      })
    }

    leafletMap.on('click', leafletClickListener)
  }

  async function focusOnZone(points: MapDrawPoint[]): Promise<void> {
    if (!leafletMap || points.length === 0) {
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
    leafletMap.setView([lat, lng], 16)
  }

  async function showLocationMarker(
    point: { lat: number; lng: number },
    label?: string,
  ): Promise<void> {
    if (!leafletMap) {
      return
    }

    destroyLeafletFocusMarkerLayer()

    const L = await import('leaflet')
    const layerGroup = L.layerGroup()

    const marker = L.marker([point.lat, point.lng], {
      icon: L.divIcon({
        className: '',
        html: '<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:#2563eb;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);transform:rotate(-45deg);"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 24],
        popupAnchor: [0, -26],
      }),
    })

    if (label) {
      marker.bindPopup(`<strong>${label}</strong>`).openPopup()
    }

    marker.addTo(layerGroup)
    layerGroup.addTo(leafletMap)
    leafletFocusMarkerLayer = layerGroup

    leafletMap.flyTo([point.lat, point.lng], 17, { duration: 0.8 })
  }

  async function renderPinnedLocations(
    pins: MapPinMarker[],
    onPinClick?: PinClickHandler | null,
  ): Promise<void> {
    if (!leafletMap) {
      return
    }

    destroyLeafletPinnedLocationsLayer()
    pinClickHandler = onPinClick ?? null

    const L = await import('leaflet')
    const layerGroup = L.layerGroup()

    pins.forEach((pin) => {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: L.icon({
          iconUrl: createPinIconSrc(),
          iconSize: [28, 40],
          iconAnchor: [14, 40],
          popupAnchor: [0, -38],
        }),
        title: pin.title,
      })

      marker.bindPopup(buildPinPopupHtml(pin), {
        className: PIN_POPUP_CLASS,
        closeButton: false,
        maxWidth: 300,
        offset: [0, -8],
      })

      marker.on('click', () => {
        pinClickHandler?.(pin.id)
      })

      marker.addTo(layerGroup)
      leafletPinMarkers.set(pin.id, marker)
    })

    layerGroup.addTo(leafletMap)
    leafletPinnedLocationsLayer = layerGroup
  }

  function openPinnedLocation(pinId: string): boolean {
    const marker = leafletPinMarkers.get(pinId)
    if (!marker || !leafletMap) {
      return false
    }

    const latLng = marker.getLatLng()
    leafletMap.flyTo(latLng, 17, { duration: 0.8 })
    marker.openPopup()
    pinClickHandler?.(pinId)
    return true
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
    showLocationMarker,
    renderPinnedLocations,
    openPinnedLocation,
  }
}
