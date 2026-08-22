<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminMapStore } from '@/stores/admin.map.store'
import { useAuthStore } from '@/stores/auth.store'
import Maplibre from '@/views/(admin)/map/components/Maplibre.vue'
import HazardFormModal from '@/views/(admin)/map/components/modals/HazardFormModal.vue'
import MappedZoneFormModal from '@/views/(admin)/map/components/modals/MappedZoneFormModal.vue'
import MapRightSideBar from '@/views/(admin)/map/components/MapRightSideBar.vue'
import { Button } from '@/components/ui/button'
import { TypographyMuted, TypographySmall } from '@/components/typography'

const adminMapStore = useAdminMapStore()

// The right-side tool strip and panels are admin/superadmin only.
const authStore = useAuthStore()
const canUseAdminTools = computed(() => authStore.isAdmin)

// ── Focus map from query params (e.g. chatbot "View on map") ───────────────
const route = useRoute()
const router = useRouter()
const isMapReady = ref(false)

function bindMapRef(instance: unknown): void {
  adminMapStore.setMapRef(instance as InstanceType<typeof Maplibre> | null)
}

function handleMapReady(): void {
  isMapReady.value = true
  void adminMapStore.onMapReady()
}

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
  <!--
    Map fills the entire main content area.
    Layout (left → right): [map canvas] [icon strip]
  -->
  <div class="relative h-full w-full overflow-hidden">
    <!-- ── Map canvas ────────────────────────────────────────────────── -->
    <div class="relative h-full w-full" :class="{ 'pr-11': canUseAdminTools }">
      <Maplibre :ref="bindMapRef" :center="adminMapStore.mapCenter" @ready="handleMapReady" />

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

      <!-- Hazard placement HUD (below provider selector) -->
      <div
        v-if="adminMapStore.isHazardPlacementActive"
        class="absolute left-3 top-24 z-900 rounded-md border bg-card/95 px-3 py-2 shadow"
      >
        <TypographySmall as="p" class="text-xs font-medium"
          >Hazard Placement Active</TypographySmall
        >
        <TypographyMuted as="p" class="text-xs">
          {{
            adminMapStore.hazardPlacementType === 'point'
              ? 'Click the map once to place a pin.'
              : `Captured ${adminMapStore.hazardDrawPoints.length} points`
          }}
        </TypographyMuted>
        <div class="mt-2 flex gap-2">
          <Button
            v-if="adminMapStore.hazardPlacementType !== 'point'"
            size="sm"
            variant="outline"
            :disabled="adminMapStore.hazardDrawPoints.length === 0"
            @click="adminMapStore.undoLastHazardPoint"
          >
            <TypographySmall as="span">Undo</TypographySmall>
          </Button>
          <Button size="sm" variant="outline" @click="adminMapStore.cancelHazardPlacement">
            <TypographySmall as="span">Cancel</TypographySmall>
          </Button>
          <Button
            v-if="adminMapStore.hazardPlacementType !== 'point'"
            size="sm"
            :disabled="
              adminMapStore.hazardPlacementType === 'linestring'
                ? adminMapStore.hazardDrawPoints.length < 2
                : adminMapStore.hazardDrawPoints.length < 3
            "
            @click="adminMapStore.finishHazardPlacement"
          >
            <TypographySmall as="span">
              {{ adminMapStore.hazardPlacementType === 'linestring' ? 'Finish Line' : 'Finish Polygon' }}
            </TypographySmall>
          </Button>
        </div>
      </div>

      <!-- Draw zone HUD (below provider selector) -->
      <div
        v-else-if="adminMapStore.isDrawMode"
        class="absolute left-3 top-24 z-900 rounded-md border bg-card/95 px-3 py-2 shadow"
      >
        <TypographySmall as="p" class="text-xs font-medium">
          {{ adminMapStore.isEditingMappedZoneGeometry ? 'Edit Polygon Mode' : 'Draw Mode Active' }}
        </TypographySmall>
        <TypographyMuted v-if="adminMapStore.isEditingMappedZoneGeometry" as="p" class="text-xs">
          Editing: {{ adminMapStore.editingMappedZoneGeometryName }}
        </TypographyMuted>
        <TypographyMuted as="p" class="text-xs"
          >{{ adminMapStore.drawPoints.length }} points</TypographyMuted
        >
        <div class="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            :disabled="adminMapStore.drawPoints.length === 0"
            @click="adminMapStore.undoLastDrawPoint"
          >
            <TypographySmall as="span">Undo</TypographySmall>
          </Button>
          <Button size="sm" variant="outline" @click="adminMapStore.cancelDrawZoneMode">
            <TypographySmall as="span">Cancel</TypographySmall>
          </Button>
          <Button
            size="sm"
            :disabled="adminMapStore.drawPoints.length < 3"
            @click="adminMapStore.finishDrawZoneMode"
          >
            <TypographySmall as="span">
              {{ adminMapStore.isEditingMappedZoneGeometry ? 'Update Polygon' : 'Save Polygon' }}
            </TypographySmall>
          </Button>
        </div>
      </div>

      <!-- Zoning error toast (bottom-left) -->
      <div
        v-if="adminMapStore.zoningError"
        class="absolute bottom-3 left-3 z-900 rounded-md border border-destructive/45 bg-destructive/12 px-3 py-2 text-destructive shadow"
      >
        <TypographySmall as="p" class="m-0 text-xs">{{ adminMapStore.zoningError }}</TypographySmall>
      </div>

      <!-- Portaled modals (Sheet — renders in <body>). Both read/write the store directly. -->
      <HazardFormModal />
      <MappedZoneFormModal />
    </div>

    <!-- ── Vertical icon strip (admin/superadmin only) ────────────── -->
    <MapRightSideBar :visible="canUseAdminTools" />
  </div>
</template>
