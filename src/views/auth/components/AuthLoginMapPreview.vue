<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { MapLibreEngine, buildMaptilerStyleUrl } from '@/engine/maplibre.egine'
import { RENTAL_SPACES, CITY_CENTER } from '@/services/chatbot/chatbot.static-data'
import { createPinIconSrc } from '@/utils/pin-icon.utils'
import { Skeleton } from '@/components/ui/skeleton'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = withDefaults(
  defineProps<{
    showPins?: boolean
  }>(),
  { showPins: true },
)

const OVERVIEW_ZOOM = 12.55
const PIN_REVEAL_ZOOM = 14.2
const CLOSE_DEG = 0.0075

const TOUR = [
  {
    lat: CITY_CENTER.lat,
    lng: CITY_CENTER.lng,
    zoom: OVERVIEW_ZOOM,
    pitch: 38,
    bearing: -12,
    duration: 6200,
    label: 'Butuan City',
  },
  ...RENTAL_SPACES.map((space, index) => ({
    lat: space.location.lat,
    lng: space.location.lng,
    zoom: 15.45,
    pitch: 50 + (index % 2) * 4,
    bearing: -28 + index * 22,
    duration: 7800,
    label: space.name,
  })),
]

const mapContainer = ref<HTMLDivElement | null>(null)
const useFallback = ref(false)
const mapReady = ref(false)
const caption = ref('Butuan City')

let engine: MapLibreEngine | null = null
let tourTimer: ReturnType<typeof setTimeout> | null = null
let stopIndex = 0
const pinElements = new Map<string, HTMLElement>()
let removeMoveListener: (() => void) | null = null

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clearTour = (): void => {
  if (tourTimer !== null) {
    clearTimeout(tourTimer)
    tourTimer = null
  }
}

const setPinShown = (id: string, shown: boolean): void => {
  const element = pinElements.get(id)
  if (!element) {
    return
  }
  element.classList.toggle('is-shown', shown)
}

const syncPinsToCamera = (): void => {
  const map = engine?.getMap()
  if (!map) {
    return
  }

  const zoom = map.getZoom()
  const center = map.getCenter()
  let activeName = 'Butuan City'

  for (const space of RENTAL_SPACES) {
    const closeEnough =
      Math.hypot(center.lat - space.location.lat, center.lng - space.location.lng) < CLOSE_DEG
    const shown = props.showPins && zoom >= PIN_REVEAL_ZOOM && closeEnough
    setPinShown(space.id, shown)
    if (zoom >= PIN_REVEAL_ZOOM && closeEnough) {
      activeName = space.name
    }
  }

  caption.value = activeName
}

const flyToStop = (index: number): void => {
  const stop = TOUR[index]
  if (!stop || !engine) {
    return
  }

  caption.value = stop.label
  engine.flyTo(
    { lat: stop.lat, lng: stop.lng },
    {
      zoom: stop.zoom,
      pitch: stop.pitch,
      bearing: stop.bearing,
      duration: stop.duration,
      essential: true,
    },
  )
}

const scheduleNext = (): void => {
  if (prefersReducedMotion()) {
    return
  }

  const current = TOUR[stopIndex]
  clearTour()
  tourTimer = setTimeout(() => {
    stopIndex = (stopIndex + 1) % TOUR.length
    flyToStop(stopIndex)
    scheduleNext()
  }, (current?.duration ?? 7000) + 1600)
}

const createSpacePin = (name: string): HTMLElement => {
  const wrap = document.createElement('div')
  wrap.className = 'login-space-pin'
  wrap.innerHTML = `
    <img src="${createPinIconSrc()}" alt="" width="22" height="32" />
    <span class="login-space-pin__label">${name}</span>
  `
  return wrap
}

const startFallback = (): void => {
  clearTour()
  removeMoveListener?.()
  removeMoveListener = null
  engine?.destroy()
  engine = null
  useFallback.value = true
}

onMounted(async () => {
  await nextTick()

  const apiKey = String(import.meta.env.VITE_MAPTILER_KEY ?? '').trim()
  if (!mapContainer.value) {
    startFallback()
    return
  }

  engine = new MapLibreEngine({
    container: mapContainer.value,
    apiKey: apiKey || undefined,
    styleUrl: apiKey ? buildMaptilerStyleUrl('streets-v2-dark', apiKey) : undefined,
    center: CITY_CENTER,
    zoom: OVERVIEW_ZOOM,
    pitch: 38,
    interactive: false,
    theme: 'dark',
  })

  try {
    await engine.init()
    engine.resize()

    if (props.showPins) {
      for (const space of RENTAL_SPACES) {
        const element = createSpacePin(space.name)
        pinElements.set(space.id, element)
        engine.addMarker(space.id, [space.location.lng, space.location.lat], {
          element,
          anchor: 'bottom',
        })
      }
    }

    const map = engine.getMap()
    if (map) {
      map.on('move', syncPinsToCamera)
      removeMoveListener = () => map.off('move', syncPinsToCamera)
    }
    syncPinsToCamera()

    mapReady.value = true
    window.setTimeout(() => engine?.resize(), 80)

    if (!prefersReducedMotion()) {
      flyToStop(0)
      scheduleNext()
    }
  } catch (error) {
    console.warn('Auth login map preview failed', error)
    startFallback()
  }
})

onBeforeUnmount(() => {
  clearTour()
  removeMoveListener?.()
  removeMoveListener = null
  engine?.destroy()
  engine = null
})
</script>

<template>
  <div class="absolute inset-0 z-10">
    <div class="absolute inset-0">
      <div ref="mapContainer" class="h-full min-h-[28rem] w-full" />
    </div>

    <div
      v-if="useFallback || !mapReady"
      class="bg-muted/40 absolute inset-0 z-20 overflow-hidden"
      aria-busy="true"
      aria-label="Loading map"
    >
      <div class="absolute inset-0 bg-linear-to-br from-muted/80 via-card to-muted/60" />
      <Skeleton class="absolute top-[18%] left-[12%] h-2 w-[38%] rounded-full opacity-70" />
      <Skeleton class="absolute top-[28%] left-[20%] h-2 w-[52%] rounded-full opacity-50" />
      <Skeleton class="absolute top-[46%] left-[8%] h-2 w-[70%] rounded-full opacity-60" />
      <Skeleton class="absolute top-[58%] right-[14%] h-2 w-[44%] rounded-full opacity-45" />
      <Skeleton class="absolute top-[72%] left-[18%] h-2 w-[56%] rounded-full opacity-55" />
      <Skeleton class="absolute top-[34%] left-[42%] size-3 rounded-full opacity-80" />
      <Skeleton class="absolute top-[52%] left-[58%] size-3 rounded-full opacity-70" />
      <Skeleton class="absolute top-[63%] left-[36%] h-7 w-5 rounded-full opacity-90" />
      <div class="absolute inset-x-4 bottom-4">
        <Skeleton class="h-6 w-28 rounded-full" />
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-0 z-30 bg-linear-to-r from-card/35 via-transparent to-transparent"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-24 bg-linear-to-t from-card/45 to-transparent"
    />
    <p
      v-show="mapReady"
      class="pointer-events-none absolute bottom-4 left-4 z-30 rounded-full bg-background/55 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground/80 backdrop-blur-sm"
    >
      {{ caption }}
    </p>
  </div>
</template>

<style>
.login-space-pin {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: translateY(10px) scale(0.55);
  pointer-events: none;
  transition:
    opacity 280ms ease,
    transform 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

.login-space-pin.is-shown {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.login-space-pin__label {
  margin-top: 4px;
  max-width: 9rem;
  border-radius: 999px;
  background: rgb(15 23 42 / 0.72);
  padding: 2px 8px;
  color: white;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
