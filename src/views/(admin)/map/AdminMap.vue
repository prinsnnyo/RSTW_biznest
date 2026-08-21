<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminMap } from '@/views/(admin)/map/composables/useAdminMap.ts'
import { useAuthStore } from '@/stores/auth.store'
import Map from '@/components/map/Map.vue'
import HazardFormModal from '@/views/(admin)/map/components/HazardFormModal.vue'
import AdminMapRightSidebar from '@/views/(admin)/map/components/AdminMapRightSidebar.vue'
import AdminMapHazardSidebar from '@/views/(admin)/map/components/AdminMapHazardSidebar.vue'
import MappedZoneFormModal from '@/views/(admin)/map/components/MappedZoneFormModal.vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { Globe, Layers, MapPin, MapPinOff, TriangleAlert } from 'lucide-vue-next'

const {
  // Map
  provider,
  mapRef,
  mapCenter,
  onMapReady,
  // Barangay borders
  isLoading,
  errorMessage,
  showBarangayBorders,
  toggleBarangayBorders,
  // Sidebar UI
  isSidebarOpen,
  isHazardSidebarOpen,
  toggleLayerSidebar,
  toggleHazardSidebar,
  // Map display
  showMapPoi,
  toggleMapPoi,
  // Zoning
  isSavingMappedZone,
  isSidebarSubmitting,
  zoningError,
  zoningLayers,
  mappedZones,
  handleCreateLayer,
  handleUpdateLayer,
  handleDeleteLayer,
  handleToggleLayerVisibility,
  // Draw zone
  isDrawMode,
  drawPoints,
  showMappedZoneModal,
  isEditingMappedZoneGeometry,
  editingMappedZoneGeometryName,
  startDrawZoneMode,
  handleStartEditMappedZoneGeometry,
  cancelDrawZoneMode,
  finishDrawZoneMode,
  undoLastDrawPoint,
  handleSaveMappedZone,
  handleUpdateMappedZone,
  handleDeleteMappedZone,
  handleFocusMappedZone,
  // Hazards
  hazardCategories,
  hazards,
  hiddenCategoryIds,
  isLoadingHazards,
  isSavingHazard,
  hazardError,
  selectedHazardId,
  hazardPlacementType,
  hazardDrawPoints,
  showHazardFormModal,
  isHazardPlacementActive,
  loadHazards,
  handleSaveHazard,
  handleToggleCategoryVisibility,
  handleStartCreateHazard,
  handleSelectHazard,
  handleUpdateHazard,
  handleDeleteHazard,
  cancelHazardPlacement,
  undoLastHazardPoint,
  finishHazardPlacement,
} = useAdminMap()

// The right-side tool strip and panels are admin/superadmin only.
const authStore = useAuthStore()
const canUseAdminTools = computed(() => authStore.isAdmin)

// ── Focus map from query params (e.g. chatbot "View on map") ───────────────
const route = useRoute()
const router = useRouter()
const isMapReady = ref(false)

function handleMapReady(): void {
  isMapReady.value = true
  onMapReady()
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

  await mapRef.value?.focusLocation({ lat, lng }, label)
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
</script>

<template>
  <!--
    Map fills the entire main content area.
    Layout (left → right): [map canvas] [hazard panel?] [layer panel?] [icon strip]
  -->
  <div class="relative h-full w-full overflow-hidden">
    <!-- ── Map canvas ────────────────────────────────────────────────── -->
    <div class="relative h-full w-full" :class="{ 'pr-11': canUseAdminTools }">
      <Map ref="mapRef" :provider="provider" :center="mapCenter" @ready="handleMapReady" />

      <!-- Floating map-provider selector (top-left over the map) -->
      <div class="absolute left-1/2 top-3 z-900 flex -translate-x-1/2 items-center gap-2">
        <Select v-model="provider">
          <SelectTrigger size="sm" class="w-48 bg-card text-foreground dark:bg-card">
            <SelectValue placeholder="Map provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="leaflet">Leaflet (OpenStreetMap)</SelectItem>
            <SelectItem value="google">Google Maps</SelectItem>
          </SelectContent>
        </Select>
        <span
          v-if="isLoading"
          class="rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow backdrop-blur-sm"
        >
          Loading borders…
        </span>
        <span
          v-else-if="errorMessage"
          class="rounded-md bg-card/90 px-2 py-1 text-xs text-destructive shadow backdrop-blur-sm"
        >
          {{ errorMessage }}
        </span>
      </div>

      <!-- Hazard placement HUD (below provider selector) -->
      <div
        v-if="isHazardPlacementActive"
        class="absolute left-3 top-24 z-900 rounded-md border bg-card/95 px-3 py-2 shadow"
      >
        <TypographySmall as="p" class="text-xs font-medium"
          >Hazard Placement Active</TypographySmall
        >
        <TypographyMuted as="p" class="text-xs">
          {{
            hazardPlacementType === 'point'
              ? 'Click the map once to place a pin.'
              : `Captured ${hazardDrawPoints.length} points`
          }}
        </TypographyMuted>
        <div class="mt-2 flex gap-2">
          <Button
            v-if="hazardPlacementType !== 'point'"
            size="sm"
            variant="outline"
            :disabled="hazardDrawPoints.length === 0"
            @click="undoLastHazardPoint"
          >
            <TypographySmall as="span">Undo</TypographySmall>
          </Button>
          <Button size="sm" variant="outline" @click="cancelHazardPlacement">
            <TypographySmall as="span">Cancel</TypographySmall>
          </Button>
          <Button
            v-if="hazardPlacementType !== 'point'"
            size="sm"
            :disabled="
              hazardPlacementType === 'linestring'
                ? hazardDrawPoints.length < 2
                : hazardDrawPoints.length < 3
            "
            @click="finishHazardPlacement"
          >
            <TypographySmall as="span">
              {{ hazardPlacementType === 'linestring' ? 'Finish Line' : 'Finish Polygon' }}
            </TypographySmall>
          </Button>
        </div>
      </div>

      <!-- Draw zone HUD (below provider selector) -->
      <div
        v-else-if="isDrawMode"
        class="absolute left-3 top-24 z-900 rounded-md border bg-card/95 px-3 py-2 shadow"
      >
        <TypographySmall as="p" class="text-xs font-medium">
          {{ isEditingMappedZoneGeometry ? 'Edit Polygon Mode' : 'Draw Mode Active' }}
        </TypographySmall>
        <TypographyMuted v-if="isEditingMappedZoneGeometry" as="p" class="text-xs">
          Editing: {{ editingMappedZoneGeometryName }}
        </TypographyMuted>
        <TypographyMuted as="p" class="text-xs">{{ drawPoints.length }} points</TypographyMuted>
        <div class="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            :disabled="drawPoints.length === 0"
            @click="undoLastDrawPoint"
          >
            <TypographySmall as="span">Undo</TypographySmall>
          </Button>
          <Button size="sm" variant="outline" @click="cancelDrawZoneMode">
            <TypographySmall as="span">Cancel</TypographySmall>
          </Button>
          <Button size="sm" :disabled="drawPoints.length < 3" @click="finishDrawZoneMode">
            <TypographySmall as="span">
              {{ isEditingMappedZoneGeometry ? 'Update Polygon' : 'Save Polygon' }}
            </TypographySmall>
          </Button>
        </div>
      </div>

      <!-- Zoning error toast (bottom-left) -->
      <div
        v-if="zoningError"
        class="absolute bottom-3 left-3 z-900 rounded-md border border-destructive/45 bg-destructive/12 px-3 py-2 text-destructive shadow"
      >
        <TypographySmall as="p" class="m-0 text-xs">{{ zoningError }}</TypographySmall>
      </div>

      <!-- Portaled modals (Sheet — renders in <body>) -->
      <HazardFormModal
        :open="showHazardFormModal"
        mode="add"
        :categories="hazardCategories"
        :is-submitting="isSavingHazard"
        :placement-type="hazardPlacementType"
        :point-count="hazardDrawPoints.length"
        @close="cancelHazardPlacement"
        @submit-create="handleSaveHazard"
      />
      <MappedZoneFormModal
        :open="showMappedZoneModal"
        :layers="zoningLayers"
        :is-submitting="isSavingMappedZone"
        :point-count="drawPoints.length"
        @close="showMappedZoneModal = false"
        @submit="handleSaveMappedZone"
      />
    </div>

    <!-- ── Hazard panel (inline, left of icon strip) ──────────────── -->
    <div v-if="canUseAdminTools && isHazardSidebarOpen" class="absolute inset-y-0 right-11 z-1000">
      <AdminMapHazardSidebar
        :hazards="hazards"
        :categories="hazardCategories"
        :hidden-category-ids="hiddenCategoryIds"
        :is-loading="isLoadingHazards"
        :is-submitting="isSavingHazard"
        :error-message="hazardError"
        :selected-hazard-id="selectedHazardId"
        @close="isHazardSidebarOpen = false"
        @refresh="loadHazards(true)"
        @toggle-category="handleToggleCategoryVisibility"
        @select-hazard="handleSelectHazard"
        @start-create-hazard="handleStartCreateHazard"
        @update-hazard="handleUpdateHazard"
        @delete-hazard="handleDeleteHazard"
      />
    </div>

    <!-- ── Layer panel (inline, left of icon strip) ───────────────── -->
    <div v-if="canUseAdminTools && isSidebarOpen" class="absolute inset-y-0 right-11 z-1000">
      <AdminMapRightSidebar
        :layers="zoningLayers"
        :mapped-zones="mappedZones"
        :is-submitting="isSidebarSubmitting"
        @close="isSidebarOpen = false"
        @start-draw-zone="startDrawZoneMode"
        @submit-layer="handleCreateLayer"
        @update-layer="handleUpdateLayer"
        @delete-layer="handleDeleteLayer"
        @update-mapped-zone="handleUpdateMappedZone"
        @edit-mapped-zone-geometry="handleStartEditMappedZoneGeometry"
        @delete-mapped-zone="handleDeleteMappedZone"
        @focus-mapped-zone="handleFocusMappedZone"
        @toggle-layer-visibility="handleToggleLayerVisibility"
      />
    </div>

    <!-- ── Vertical icon strip (admin/superadmin only) ────────────── -->
    <div
      v-if="canUseAdminTools"
      class="absolute inset-y-0 right-0 z-1001 flex w-11 shrink-0 flex-col border-l bg-card"
    >
      <TooltipProvider :delay-duration="300">
        <!-- Layers -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
              :class="isSidebarOpen ? 'bg-muted text-foreground' : 'text-muted-foreground'"
              @click="toggleLayerSidebar"
            >
              <Layers class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Layers</TooltipContent>
        </Tooltip>

        <div class="h-px bg-border" />

        <!-- Hazards -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
              :class="isHazardSidebarOpen ? 'bg-muted text-amber-500' : 'text-muted-foreground'"
              @click="toggleHazardSidebar"
            >
              <TriangleAlert class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Hazards</TooltipContent>
        </Tooltip>

        <div class="h-px bg-border" />

        <!-- Barangay borders -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              :class="showBarangayBorders ? 'bg-muted text-foreground' : 'text-muted-foreground'"
              :disabled="isLoading"
              @click="toggleBarangayBorders"
            >
              <Globe class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {{ showBarangayBorders ? 'Hide Barangay Borders' : 'Show Barangay Borders' }}
          </TooltipContent>
        </Tooltip>

        <div class="h-px bg-border" />

        <!-- Map POI -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
              :class="showMapPoi ? 'bg-muted text-foreground' : 'text-muted-foreground'"
              @click="toggleMapPoi"
            >
              <MapPin v-if="showMapPoi" class="h-4 w-4" />
              <MapPinOff v-else class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {{ showMapPoi ? 'Hide Map POI' : 'Show Map POI' }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</template>
