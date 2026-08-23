import type { GooglePolygonPath } from '@/types/map.types'

export type GoogleMapEventName = 'click' | 'idle' | 'mousedown' | 'mousemove' | 'mouseup'

export interface GoogleMapInstance {
  setCenter: (latLng: { lat: number; lng: number }) => void
  setZoom?: (zoom: number) => void
  getCenter?: () => GoogleLatLng | undefined
  getZoom?: () => number | undefined
  getDiv: () => HTMLElement
  setOptions?: (options: {
    draggableCursor?: string | null
    styles?: GoogleMapStyleRule[]
    draggable?: boolean
    gestureHandling?: 'auto' | 'cooperative' | 'greedy' | 'none'
  }) => void
  addListener?: (
    eventName: GoogleMapEventName,
    handler: (event: GoogleMapMouseEvent) => void,
  ) => GoogleMapsEventListener
}

export interface GoogleMapStyleRule {
  elementType?: string
  featureType?: string
  stylers: Array<Record<string, string | number>>
}

export interface GoogleLatLng {
  lat: () => number
  lng: () => number
}

export interface GoogleMapMouseEvent {
  latLng?: GoogleLatLng
}

export interface GoogleMapsEventListener {
  remove: () => void
}

export interface GooglePolygonInstance {
  setMap: (map: GoogleMapInstance | null) => void
  addListener?: (
    eventName: 'click' | 'mouseover' | 'mouseout',
    handler: (event: GoogleMapMouseEvent) => void,
  ) => void
}

export interface GooglePolylineInstance {
  setMap: (map: GoogleMapInstance | null) => void
}

export interface GoogleMarkerInstance {
  setMap: (map: GoogleMapInstance | null) => void
  addListener?: (
    eventName: 'click' | 'dragend',
    handler: (event: GoogleMapMouseEvent) => void,
  ) => GoogleMapsEventListener
}

export interface GoogleInfoWindowInstance {
  setContent: (content: string) => void
  setPosition: (position: GooglePolygonPath) => void
  open: (options: { map: GoogleMapInstance }) => void
  close: () => void
}

export type GoogleMapCtor = new (
  element: HTMLElement,
  options: {
    center: { lat: number; lng: number }
    zoom: number
    mapId?: string
    styles?: GoogleMapStyleRule[]
    zoomControl?: boolean
    zoomControlOptions?: { position: number }
    streetViewControl?: boolean
    streetViewControlOptions?: { position: number }
  },
) => GoogleMapInstance

export interface AdvancedMarkerLibrary {
  AdvancedMarkerElement: new (options: {
    position: { lat: number; lng: number }
    map: GoogleMapInstance
    title?: string
  }) => unknown
}

export type LegacyMarkerCtor = new (options: {
  position: { lat: number; lng: number }
  map: GoogleMapInstance
  title?: string
  draggable?: boolean
  zIndex?: number
  icon?:
    | {
        path: string
        fillColor: string
        fillOpacity: number
        strokeColor: string
        strokeOpacity: number
        strokeWeight: number
        scale: number
      }
    | { url: string }
}) => GoogleMarkerInstance

export interface GoogleMapsAPI {
  Map?: GoogleMapCtor
  Marker?: LegacyMarkerCtor
  ControlPosition?: Record<'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT', number>
  Polygon?: new (options: {
    paths: GooglePolygonPath[][]
    strokeColor: string
    strokeOpacity: number
    strokeWeight: number
    fillColor: string
    fillOpacity: number
    map: GoogleMapInstance
  }) => GooglePolygonInstance
  Polyline?: new (options: {
    path: GooglePolygonPath[]
    strokeColor: string
    strokeOpacity: number
    strokeWeight: number
    map: GoogleMapInstance
  }) => GooglePolylineInstance
  InfoWindow?: new () => GoogleInfoWindowInstance
  importLibrary?: (name: string) => Promise<unknown>
  marker?: {
    AdvancedMarkerElement?: AdvancedMarkerLibrary['AdvancedMarkerElement']
  }
}

export interface MapsLibrary {
  Map: GoogleMapCtor
}

export type GoogleWindow = Window & {
  gm_authFailure?: () => void
  __googleMapsAuthFailed?: boolean
  google?: {
    maps?: GoogleMapsAPI
  }
}
