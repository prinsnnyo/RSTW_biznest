<!-- Maplibre.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type {
  BarangayFeatureCollection,
  MapLayerInfo,
  MapLightSettings,
  MapProjectionType,
  MapSkySettings,
  MapSpaceSettings,
} from '@/types/map.types'
import type { Hazard } from '@/types/hazard.types'
import type { MapDrawPoint, MappedZone } from '@/types/zoning.types'
import type { MapPinMarker } from '@/types/pinned-location.types'
import { useMapLibreAdapter } from '@/composables/map/useMapLibreAdapter'
import {
  drawGlobeSpaceOverlay,
  generateStarField,
  SPACE_PRESET_STAR_DENSITY,
  type StarPoint,
} from '@/utils/map/globeSpaceOverlay.utils'
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
  (e: 'camera-idle', center: { lat: number; lng: number }): void
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

// ── Globe "Space"/"Halo" overlay ────────────────────────────────────────────
// MapLibre's globe projection has no native starfield/atmosphere-image
// support, so Space Color + Halo are drawn ourselves on a canvas layered on
// top of the map, with a transparent hole punched over the rendered globe.
const spaceCanvas = ref<HTMLCanvasElement | null>(null)
let spaceResizeObserver: ResizeObserver | null = null
let starField: StarPoint[] = []
let mapProjection: MapProjectionType = 'mercator'
let spaceSettings: MapSpaceSettings = {
  preset: 'none',
  haloColor: '#88c6fc',
  haloOpacity: 0,
  haloScale: 1.15,
}

function drawSpaceOverlay(): void {
  const canvas = spaceCanvas.value
  if (!canvas) {
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  if (mapProjection !== 'globe') {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    return
  }

  const dpr = window.devicePixelRatio || 1
  const geometry = mapLibreAdapter.getGlobeScreenGeometry()

  drawGlobeSpaceOverlay(ctx, canvas.width, canvas.height, {
    preset: spaceSettings.preset,
    haloColor: spaceSettings.haloColor,
    haloOpacity: spaceSettings.haloOpacity,
    haloScale: spaceSettings.haloScale,
    globe: geometry
      ? {
          center: { x: geometry.center.x * dpr, y: geometry.center.y * dpr },
          radius: geometry.radius * dpr,
        }
      : null,
    stars: starField,
  })
}

function resizeSpaceCanvas(): void {
  const canvas = spaceCanvas.value
  const container = mapContainer.value
  if (!canvas || !container) {
    return
  }

  const rect = container.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  starField = generateStarField(canvas.width, canvas.height, SPACE_PRESET_STAR_DENSITY[spaceSettings.preset])
  drawSpaceOverlay()
}

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
    mapLibreAdapter.setCameraIdleHandler((camera) => {
      saveStoredCamera({ zoom: camera.zoom, pitch: camera.pitch })
      emit('camera-idle', camera.center)
    })
    mapLibreAdapter.setRenderHandler(drawSpaceOverlay)
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

  spaceResizeObserver = new ResizeObserver(() => resizeSpaceCanvas())
  if (mapContainer.value) {
    spaceResizeObserver.observe(mapContainer.value)
  }
  resizeSpaceCanvas()

  await initMap()
})

onBeforeUnmount(() => {
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }

  spaceResizeObserver?.disconnect()
  spaceResizeObserver = null

  mapLibreAdapter.setCameraIdleHandler(null)
  mapLibreAdapter.setRenderHandler(null)
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

function clearFocusMarker(): void {
  mapLibreAdapter.clearFocusMarker()
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

function setFreehandDrawHandler(handler: ((point: MapDrawPoint) => void) | null): void {
  mapLibreAdapter.setFreehandDrawHandler(handler)
}

function setCenter(center: { lat: number; lng: number }, zoom?: number): void {
  mapLibreAdapter.setCenter(center, zoom)
}

function getPoiTypes(): string[] {
  return mapLibreAdapter.getPoiTypes()
}

function setPoiTypeVisible(type: string, visible: boolean): void {
  mapLibreAdapter.setPoiTypeVisible(type, visible)
}

function getMapLayers(): MapLayerInfo[] {
  return mapLibreAdapter.getMapLayers()
}

function setMapLayerVisible(id: string, visible: boolean): void {
  mapLibreAdapter.setMapLayerVisible(id, visible)
}

function setMapProjection(type: MapProjectionType): void {
  mapProjection = type
  mapLibreAdapter.setMapProjection(type)
  drawSpaceOverlay()
}

function setMapTerrain(enabled: boolean): void {
  mapLibreAdapter.setMapTerrain(enabled)
}

function setMapLight(light: MapLightSettings): void {
  mapLibreAdapter.setMapLight(light)
}

function setMapSky(sky: MapSkySettings): void {
  mapLibreAdapter.setMapSky(sky)
}

function setMapSpace(space: MapSpaceSettings): void {
  const densityChanged =
    SPACE_PRESET_STAR_DENSITY[space.preset] !== SPACE_PRESET_STAR_DENSITY[spaceSettings.preset]
  spaceSettings = space
  if (densityChanged && spaceCanvas.value) {
    starField = generateStarField(spaceCanvas.value.width, spaceCanvas.value.height, SPACE_PRESET_STAR_DENSITY[space.preset])
  }
  drawSpaceOverlay()
}

async function renderPinnedLocations(
  pins: MapPinMarker[],
  onPinClick?: ((pinId: string) => void) | null,
): Promise<void> {
  await mapLibreAdapter.renderPinnedLocations(pins, onPinClick)
}

function openPinnedLocation(pinId: string): boolean {
  return mapLibreAdapter.openPinnedLocation(pinId)
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
  getMapLayers,
  setMapLayerVisible,
  setMapProjection,
  setMapTerrain,
  setMapLight,
  setMapSky,
  setMapSpace,
  renderPinnedLocations,
  openPinnedLocation,
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
      <!-- Globe Space/Halo overlay — sits above the WebGL canvas, below controls. -->
      <canvas ref="spaceCanvas" class="pointer-events-none absolute inset-0 z-10 h-full w-full"></canvas>
    </div>
  </div>
</template>

<style scoped src="@/components/map/Map.css"></style>
<style scoped>
:deep(.maplibregl-control-container) {
  position: relative;
  z-index: 20;
}
</style>
