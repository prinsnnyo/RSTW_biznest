<!-- Maplibre.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BarangayFeatureCollection } from '@/types/map.types'
import type { Hazard } from '@/types/hazard.types'
import type { MapDrawPoint, MappedZone } from '@/types/zoning.types'
import type { MapPinMarker } from '@/types/pinned-location.types'
import { useMapLibreAdapter } from '@/composables/map/useMapLibreAdapter'
import 'maplibre-gl/dist/maplibre-gl.css'

defineOptions({
  name: 'AdminMaplibreCanvas',
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
}>()

const CAMERA_STORAGE_KEY = 'biznest:admin-map:camera'

interface StoredCamera {
  zoom: number
  pitch: number
}

function loadStoredCamera(): StoredCamera | null {
  try {
    const raw = localStorage.getItem(CAMERA_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredCamera>
    if (typeof parsed.zoom !== 'number' || typeof parsed.pitch !== 'number') {
      return null
    }

    return { zoom: parsed.zoom, pitch: parsed.pitch }
  } catch {
    return null
  }
}

function saveStoredCamera(camera: StoredCamera): void {
  try {
    localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(camera))
  } catch {
    // Storage unavailable (private mode, quota) — persistence is best-effort.
  }
}

const mapContainer = ref<HTMLDivElement | null>(null)
const mapError = ref('')
let themeObserver: MutationObserver | null = null

const maptilerApiKey = import.meta.env.VITE_MAPTILER_KEY ?? ''
const storedCamera = loadStoredCamera()

const mapLibreAdapter = useMapLibreAdapter({
  containerRef: mapContainer,
  center: props.center,
  zoom: storedCamera?.zoom,
  pitch: storedCamera?.pitch,
  getApiKey: () => maptilerApiKey,
})

function getActiveTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function syncMapThemeWithApp(): void {
  mapLibreAdapter.setTheme(getActiveTheme())
}

async function initMap(): Promise<void> {
  mapError.value = ''

  try {
    await mapLibreAdapter.init()
    mapLibreAdapter.setCameraIdleHandler(saveStoredCamera)
    emit('ready')
  } catch (error) {
    console.warn('MapLibre unavailable', error)

    if (error instanceof Error && error.message) {
      mapError.value = error.message
      return
    }

    mapError.value = 'MapLibre failed to load. Check the MapTiler API key.'
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

watch(
  () => props.center,
  (center) => {
    if (!center) {
      return
    }

    mapLibreAdapter.setCenter(center)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }

  mapLibreAdapter.setCameraIdleHandler(null)
  mapLibreAdapter.destroy()
})

// ── Imperative render API (called by parent via template ref) ──────────────

async function renderBarangayBorders(
  show: boolean,
  borders: BarangayFeatureCollection | null,
): Promise<void> {
  await mapLibreAdapter.renderBarangayBorders(show, borders)
}

async function renderMappedZones(zones: MappedZone[]): Promise<void> {
  await mapLibreAdapter.renderMappedZones(zones)
}

async function renderHazards(show: boolean, hazards: Hazard[]): Promise<void> {
  await mapLibreAdapter.renderHazards(show, hazards)
}

async function renderDrawPreview(points: MapDrawPoint[]): Promise<void> {
  await mapLibreAdapter.renderDrawPreview(points)
}

async function focusOnZone(points: MapDrawPoint[]): Promise<void> {
  await mapLibreAdapter.focusOnZone(points)
}

async function focusLocation(point: { lat: number; lng: number }, label?: string): Promise<void> {
  await mapLibreAdapter.showLocationMarker(point, label)
}

function setDrawMode(enabled: boolean): void {
  mapLibreAdapter.setDrawMode(enabled)
}

function setMapClickHandler(handler: ((point: MapDrawPoint) => void) | null): void {
  mapLibreAdapter.setMapClickHandler(handler)
}

function setDrawPointMoveHandler(
  handler: ((index: number, point: MapDrawPoint) => void) | null,
): void {
  mapLibreAdapter.setDrawPointMoveHandler(handler)
}

function setCenter(center: { lat: number; lng: number }, zoom?: number): void {
  mapLibreAdapter.setCenter(center, zoom)
}

function setPoisVisible(visible: boolean): void {
  mapLibreAdapter.setPoisVisible(visible)
}

async function renderPinnedLocations(
  pins: MapPinMarker[],
  onPinClick?: ((pinId: string) => void) | null,
): Promise<void> {
  await mapLibreAdapter.renderPinnedLocations(pins, onPinClick)
}

defineExpose({
  renderBarangayBorders,
  renderMappedZones,
  renderHazards,
  renderDrawPreview,
  focusOnZone,
  focusLocation,
  setDrawMode,
  setMapClickHandler,
  setDrawPointMoveHandler,
  setCenter,
  setPoisVisible,
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
      Two nested divs on purpose: maplibre-gl's own stylesheet sets
      `position: relative` on whatever element you hand it as a container.
      If that same element also carries Tailwind's `absolute inset-0` class,
      the two same-specificity rules fight over `position`, and whichever
      stylesheet loads later wins — collapsing this to height 0 when
      maplibre-gl's CSS wins. Keep the positioning on an outer div maplibre
      never touches, and hand maplibre a plain inner div instead.
    -->
    <div class="absolute inset-0 z-0">
      <div ref="mapContainer" class="h-full w-full"></div>
    </div>
  </div>
</template>

<style scoped src="@/components/map/Map.css"></style>
