import type {
  AdvancedMarkerLibrary,
  GoogleMapCtor,
  GoogleMapInstance,
  GoogleWindow,
  MapsLibrary,
} from '@/types/google-map-adapter.types'

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function loadGoogleMapsScript(
  resolvedGoogleMapsApiKey: string,
  existingLoader: Promise<void> | null,
): Promise<void> {
  const googleWindow = window as GoogleWindow

  if (!resolvedGoogleMapsApiKey) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))
  }

  if (googleWindow.google?.maps) {
    return Promise.resolve()
  }

  if (existingLoader) {
    return existingLoader
  }

  googleWindow.__googleMapsAuthFailed = false
  googleWindow.gm_authFailure = () => {
    googleWindow.__googleMapsAuthFailed = true
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-sdk') as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Google Maps failed to load')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-sdk'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${resolvedGoogleMapsApiKey}&loading=async&libraries=marker&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => {
      // gm_authFailure is invoked by the Google SDK when key auth or billing checks fail.
      if (googleWindow.__googleMapsAuthFailed) {
        reject(
          new Error(
            'Google Maps authentication failed. Verify API key, billing, and allowed referrers.',
          ),
        )
        return
      }

      resolve()
    }
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })
}

const DEFAULT_ZOOM = 12

export async function initializeGoogleMapInstance(options: {
  container: HTMLElement | null
  center: { lat: number; lng: number }
  zoom?: number
  mapId?: string
  onMapReady: (map: GoogleMapInstance) => void
}): Promise<boolean> {
  if (!options.container) {
    return false
  }

  const googleMaps = (window as GoogleWindow).google?.maps

  if (!googleMaps) {
    return false
  }

  let MapCtor: GoogleMapCtor | undefined
  let AdvancedMarkerElement: AdvancedMarkerLibrary['AdvancedMarkerElement'] | undefined

  if (typeof googleMaps.Map === 'function') {
    MapCtor = googleMaps.Map
  }

  if (!MapCtor && typeof googleMaps.importLibrary === 'function') {
    const mapsLibrary = (await googleMaps.importLibrary('maps')) as unknown as MapsLibrary
    if (typeof mapsLibrary.Map === 'function') {
      MapCtor = mapsLibrary.Map
    }
  }

  // Advanced Markers require a valid mapId; skip when not configured.
  if (options.mapId && typeof googleMaps.importLibrary === 'function') {
    const markerLibrary = (await googleMaps.importLibrary(
      'marker',
    )) as unknown as AdvancedMarkerLibrary
    AdvancedMarkerElement = markerLibrary.AdvancedMarkerElement
  } else if (options.mapId) {
    AdvancedMarkerElement = googleMaps.marker?.AdvancedMarkerElement
  }

  if (!MapCtor) {
    return false
  }

  const controlPosition = googleMaps.ControlPosition?.TOP_LEFT

  const map = new MapCtor(options.container, {
    center: options.center,
    zoom: options.zoom ?? DEFAULT_ZOOM,
    mapId: options.mapId,
    zoomControl: true,
    zoomControlOptions:
      controlPosition !== undefined ? { position: controlPosition } : undefined,
    streetViewControl: true,
    streetViewControlOptions:
      controlPosition !== undefined ? { position: controlPosition } : undefined,
  })

  options.onMapReady(map)

  if (AdvancedMarkerElement) {
    new AdvancedMarkerElement({
      position: options.center,
      map,
      title: 'Butuan City',
    })
    return true
  }

  if (googleMaps.Marker) {
    new googleMaps.Marker({
      position: options.center,
      map,
      title: 'Butuan City',
    })
    return true
  }

  return true
}
