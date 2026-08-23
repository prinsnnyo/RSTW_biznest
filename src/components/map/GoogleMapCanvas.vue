<!-- GoogleMapCanvas.vue -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { BarangayFeatureCollection } from '@/types/map.types'
import type { Hazard } from '@/types/hazard.types'
import type { MapDrawPoint, MappedZone } from '@/types/zoning.types'
import type { MapPinMarker } from '@/types/pinned-location.types'
import { useGoogleMapAdapter } from '@/composables/map/useGoogleMapAdapter'

defineOptions({
  name: 'GoogleMapCanvas',
})

const props = withDefaults(
  defineProps<{
    center?: { lat: number; lng: number }
  }>(),
  {
    center: () => ({ lat: 8.9475, lng: 125.5406 }),
  },
)

const emit = defineEmits<{
  (e: 'ready'): void
  (e: 'camera-idle', center: { lat: number; lng: number }): void
}>()

// Separate from the MapLibre canvas key: the two providers do not share a
// zoom scale closely enough for one stored value to serve both.
const CAMERA_STORAGE_KEY = 'biznest:user-map:camera'

function loadStoredZoom(): number | undefined {
  try {
    const raw = localStorage.getItem(CAMERA_STORAGE_KEY)
    if (!raw) {
      return undefined
    }

    const parsed = JSON.parse(raw) as { zoom?: unknown }
    return typeof parsed.zoom === 'number' ? parsed.zoom : undefined
  } catch {
    return undefined
  }
}

function saveStoredZoom(zoom: number): void {
  try {
    localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify({ zoom }))
  } catch {
    // Storage unavailable (private mode, quota) — persistence is best-effort.
  }
}

const mapContainer = ref<HTMLDivElement | null>(null)
const mapError = ref('')
let themeObserver: MutationObserver | null = null

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

const googleMapAdapter = useGoogleMapAdapter({
  containerRef: mapContainer,
  center: props.center,
  zoom: loadStoredZoom(),
  getApiKey: () => googleMapsApiKey,
})

function getActiveTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function syncMapThemeWithApp(): void {
  googleMapAdapter.setTheme(getActiveTheme())
}

async function initMap(): Promise<void> {
  mapError.value = ''

  try {
    await googleMapAdapter.init()
    // Basemap POIs stay on so the per-type toggles have something to hide.
    googleMapAdapter.setPoisVisible(true)
    googleMapAdapter.setCameraIdleHandler((camera) => {
      saveStoredZoom(camera.zoom)
      emit('camera-idle', camera.center)
    })
    emit('ready')
  } catch (error) {
    console.warn('Google Maps unavailable', error)

    if (error instanceof Error && error.message) {
      mapError.value = error.message
      return
    }

    mapError.value = 'Google Maps failed to load. Check the Google Maps API key.'
  }
}

onMounted(async () => {
  syncMapThemeWithApp()

  themeObserver = new MutationObserver(() => {
    syncMapThemeWithApp()
  })

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  await initMap()
})

onBeforeUnmount(() => {
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }

  googleMapAdapter.setCameraIdleHandler(null)
  googleMapAdapter.destroy()
})

// ── Imperative render API (MapCanvasApi, called by the store via template ref)

async function renderBarangayBorders(
  show: boolean,
  borders: BarangayFeatureCollection | null,
): Promise<void> {
  await googleMapAdapter.renderBarangayBorders(show, borders)
}

async function renderMappedZones(zones: MappedZone[]): Promise<void> {
  await googleMapAdapter.renderMappedZones(zones)
}

async function renderHazards(show: boolean, hazards: Hazard[]): Promise<void> {
  await googleMapAdapter.renderHazards(show, hazards)
}

async function renderDrawPreview(points: MapDrawPoint[]): Promise<void> {
  await googleMapAdapter.renderDrawPreview(points)
}

async function focusOnZone(points: MapDrawPoint[]): Promise<void> {
  await googleMapAdapter.focusOnZone(points)
}

async function focusLocation(point: { lat: number; lng: number }, label?: string): Promise<void> {
  googleMapAdapter.showLocationMarker(point, label)
}

function clearFocusMarker(): void {
  googleMapAdapter.clearFocusMarker()
}

function setDrawMode(enabled: boolean): void {
  googleMapAdapter.setDrawMode(enabled)
}

function setMapClickHandler(handler: ((point: MapDrawPoint) => void) | null): void {
  googleMapAdapter.setMapClickHandler(handler)
}

function setDrawPointMoveHandler(
  handler: ((index: number, point: MapDrawPoint) => void) | null,
): void {
  googleMapAdapter.setDrawPointMoveHandler(handler)
}

function setFreehandDrawHandler(handler: ((point: MapDrawPoint) => void) | null): void {
  googleMapAdapter.setFreehandDrawHandler(handler)
}

function setCenter(center: { lat: number; lng: number }, zoom?: number): void {
  googleMapAdapter.setCenter(center, zoom)
}

function getPoiTypes(): string[] {
  return googleMapAdapter.getPoiTypes()
}

function setPoiTypeVisible(type: string, visible: boolean): void {
  googleMapAdapter.setPoiTypeVisible(type, visible)
}

async function renderPinnedLocations(
  pins: MapPinMarker[],
  onPinClick?: ((pinId: string) => void) | null,
): Promise<void> {
  googleMapAdapter.renderPinnedLocations(pins, onPinClick)
}

defineExpose({
  renderBarangayBorders,
  renderMappedZones,
  renderHazards,
  renderDrawPreview,
  focusOnZone,
  focusLocation,
  clearFocusMarker,
  setDrawMode,
  setMapClickHandler,
  setDrawPointMoveHandler,
  setFreehandDrawHandler,
  setCenter,
  getPoiTypes,
  setPoiTypeVisible,
  renderPinnedLocations,
})
</script>

<template>
  <div class="relative h-full w-full z-0">
    <div
      v-if="mapError"
      class="absolute left-3 top-3 z-50 rounded-md border border-destructive/45 bg-destructive/12 px-3 py-2 text-xs text-destructive shadow"
    >
      {{ mapError }}
    </div>
    <!--
      Same nesting rationale as the MapLibre canvas: the Google SDK writes
      `position: relative` onto the element it is handed, so positioning stays
      on an outer div the SDK never touches.
    -->
    <div class="absolute inset-0 z-0">
      <div ref="mapContainer" class="h-full w-full"></div>
    </div>
  </div>
</template>

<style scoped src="@/components/map/Map.css"></style>
