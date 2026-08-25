<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { MapLibreEngine, buildMaptilerStyleUrl } from '@/engine/maplibre.egine'
import { CITY_CENTER } from '@/services/chatbot/chatbot.static-data'
import { Skeleton } from '@/components/ui/skeleton'
import 'maplibre-gl/dist/maplibre-gl.css'

const ORBIT_ZOOM = 13.35
const ORBIT_PITCH = 54
const ORBIT_RADIUS = 0.016
const SEGMENT_MS = 11000
const ANGLE_STEP = 0.42

const mapContainer = ref<HTMLDivElement | null>(null)
const useFallback = ref(false)
const mapReady = ref(false)

let engine: MapLibreEngine | null = null
let orbitTimer: ReturnType<typeof setTimeout> | null = null
let angle = 0.35

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clearOrbit = (): void => {
  if (orbitTimer !== null) {
    clearTimeout(orbitTimer)
    orbitTimer = null
  }
}

const cameraForAngle = (theta: number) => {
  const lat = CITY_CENTER.lat + ORBIT_RADIUS * Math.sin(theta)
  const lng = CITY_CENTER.lng + ORBIT_RADIUS * Math.cos(theta)
  const bearing =
    (Math.atan2(CITY_CENTER.lng - lng, CITY_CENTER.lat - lat) * 180) / Math.PI
  return { lat, lng, bearing }
}

const easeOrbit = (duration: number, essential: boolean): void => {
  const map = engine?.getMap()
  if (!map) {
    return
  }

  const next = cameraForAngle(angle)
  map.easeTo({
    center: [next.lng, next.lat],
    bearing: next.bearing,
    pitch: ORBIT_PITCH + Math.sin(angle * 1.6) * 4,
    zoom: ORBIT_ZOOM + Math.sin(angle * 0.9) * 0.18,
    duration,
    essential,
    easing: (t) => t,
  })
}

const scheduleOrbit = (): void => {
  if (prefersReducedMotion()) {
    return
  }

  clearOrbit()
  orbitTimer = setTimeout(() => {
    angle += ANGLE_STEP
    easeOrbit(SEGMENT_MS, true)
    scheduleOrbit()
  }, SEGMENT_MS)
}

const startFallback = (): void => {
  clearOrbit()
  engine?.destroy()
  engine = null
  useFallback.value = true
}

onMounted(async () => {
  await nextTick()

  const apiKey = String(import.meta.env.VITE_MAPTILER_KEY ?? '').trim()
  if (!apiKey || !mapContainer.value) {
    startFallback()
    return
  }

  const start = cameraForAngle(angle)

  engine = new MapLibreEngine({
    container: mapContainer.value,
    apiKey,
    styleUrl: buildMaptilerStyleUrl('streets-v2-dark', apiKey),
    center: { lat: start.lat, lng: start.lng },
    zoom: ORBIT_ZOOM,
    pitch: ORBIT_PITCH,
    interactive: false,
    theme: 'dark',
  })

  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Map preview timed out')), 20000)
  })

  try {
    await Promise.race([engine.init(), timeout])
    engine.resize()
    engine.getMap()?.setBearing(start.bearing)

    mapReady.value = true
    window.setTimeout(() => engine?.resize(), 80)

    if (!prefersReducedMotion()) {
      angle += ANGLE_STEP
      easeOrbit(SEGMENT_MS, true)
      scheduleOrbit()
    }
  } catch {
    startFallback()
  }
})

onBeforeUnmount(() => {
  clearOrbit()
  engine?.destroy()
  engine = null
})
</script>

<template>
  <div class="absolute inset-0 z-10">
    <div class="absolute inset-0">
      <div ref="mapContainer" class="h-full w-full" />
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
      <div class="absolute inset-x-4 bottom-4">
        <Skeleton class="h-6 w-28 rounded-full" />
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-0 z-30 bg-linear-to-r from-card/40 via-transparent to-transparent"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-24 bg-linear-to-t from-card/45 to-transparent"
    />
    <p
      v-show="mapReady"
      class="pointer-events-none absolute bottom-4 left-4 z-30 rounded-full bg-background/55 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground/80 backdrop-blur-sm"
    >
      Butuan City
    </p>
  </div>
</template>
