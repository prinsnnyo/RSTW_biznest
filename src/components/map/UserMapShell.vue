<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GoogleMapCanvas from '@/components/map/GoogleMapCanvas.vue'
import { useAdminMapStore } from '@/stores/admin.map.store'
import type { MapCanvasApi } from '@/types/map.types'

/**
 * The non-admin map shell: Google canvas, store wiring, border-load status and
 * chatbot focus handling. Feature shells (space-owner pin tool, smart analysis)
 * layer their own controls in through the default slot.
 */
defineOptions({
  name: 'UserMapShell',
})

// `insetRight` reserves the width of a right-hand icon strip so the strip does
// not sit on top of the canvas.
const props = withDefaults(
  defineProps<{
    insetRight?: boolean
  }>(),
  {
    insetRight: false,
  },
)

const adminMapStore = useAdminMapStore()
const route = useRoute()
const router = useRouter()
const isMapReady = ref(false)

function bindMapRef(instance: unknown): void {
  const canvas = (instance as MapCanvasApi | null) ?? null

  if (!canvas) {
    isMapReady.value = false
  }

  adminMapStore.setMapRef(canvas)
}

function handleMapReady(): void {
  isMapReady.value = true
  void adminMapStore.onMapReady()
}

function handleCameraIdle(center: { lat: number; lng: number }): void {
  adminMapStore.setMapCenter(center)
}

// ── Focus map from query params (e.g. chatbot "View on map") ───────────────
async function applyFocusFromQuery(): Promise<void> {
  if (!isMapReady.value) {
    return
  }

  const lat = Number(route.query.lat)
  const lng = Number(route.query.lng)
  const label = typeof route.query.label === 'string' ? route.query.label : undefined

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return
  }

  await adminMapStore.mapRef?.focusLocation({ lat, lng }, label)
  await router.replace({ query: {} })
}

watch(isMapReady, () => {
  void applyFocusFromQuery()
})

watch(
  () => route.query,
  () => {
    void applyFocusFromQuery()
  },
)

onMounted(() => {
  void adminMapStore.initialize()
})

onBeforeUnmount(() => {
  adminMapStore.dispose()
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div class="relative h-full w-full" :class="{ 'pr-11': props.insetRight }">
      <GoogleMapCanvas
        :ref="bindMapRef"
        :center="adminMapStore.mapCenter"
        @ready="handleMapReady"
        @camera-idle="handleCameraIdle"
      />
    </div>

    <!-- Barangay-border load status (top-left over the map) -->
    <div
      v-if="adminMapStore.isLoading || adminMapStore.errorMessage"
      class="absolute left-3 top-3 z-900 flex items-center gap-2"
    >
      <span
        v-if="adminMapStore.isLoading"
        class="rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow backdrop-blur-sm"
      >
        Loading borders…
      </span>
      <span
        v-else-if="adminMapStore.errorMessage"
        class="rounded-md bg-card/90 px-2 py-1 text-xs text-destructive shadow backdrop-blur-sm"
      >
        {{ adminMapStore.errorMessage }}
      </span>
    </div>

    <slot :is-map-ready="isMapReady" />
  </div>
</template>
