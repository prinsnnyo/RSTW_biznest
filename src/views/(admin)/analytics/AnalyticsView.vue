<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { PencilRuler } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import Maplibre from '@/views/(admin)/map/components/Maplibre.vue'
import AreaAnalysisDrawer from '@/views/(user)/map/components/AreaAnalysisDrawer.vue'
import SmartAnalysisToolbar from '@/views/(user)/map/components/SmartAnalysisToolbar.vue'
import NearestSpacesReportModal from '@/components/smart-analysis/NearestSpacesReportModal.vue'
import NearestSuppliersReportModal from '@/components/smart-analysis/NearestSuppliersReportModal.vue'
import SuitabilityReportModal from '@/components/smart-analysis/SuitabilityReportModal.vue'
import TopBusinessesReportModal from '@/components/smart-analysis/TopBusinessesReportModal.vue'
import { useSmartAnalysis } from '@/views/(user)/map/composables/useSmartAnalysis'
import { useAdminMapStore } from '@/stores/admin.map.store'
import type { MapCanvasApi } from '@/types/map.types'

/**
 * Admin Analytics: MapLibre canvas + draw-a-zone → Analyze Area, reusing the
 * same smart-analysis drawer/forms/reports as the entrepreneur map.
 */
const adminMapStore = useAdminMapStore()
const analysis = useSmartAnalysis()
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
  // Analytics page is draw-first: start capturing points as soon as the map is live.
  if (!analysis.isActive.value) {
    analysis.beginDrawing()
  }
}

function handleCameraIdle(center: { lat: number; lng: number }): void {
  adminMapStore.setMapCenter(center)
}

function focusOnLocation(payload: { lat: number; lng: number; label: string }): void {
  analysis.dismissReports()
  void adminMapStore.mapRef?.focusLocation({ lat: payload.lat, lng: payload.lng }, payload.label)
}

function toggleDraw(): void {
  if (analysis.drawing.isDrawing.value) {
    analysis.finishDrawing()
    return
  }

  analysis.beginDrawing()
}

function startDrawing(): void {
  analysis.beginDrawing()
}

onMounted(() => {
  void adminMapStore.initialize()
})

onBeforeUnmount(() => {
  analysis.resetAll()
  adminMapStore.dispose()
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div class="relative h-full w-full">
      <Maplibre
        :ref="bindMapRef"
        :center="adminMapStore.mapCenter"
        @ready="handleMapReady"
        @camera-idle="handleCameraIdle"
      />

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

      <!-- Idle prompt when the tool was cleared -->
      <div
        v-if="isMapReady && !analysis.isActive.value"
        class="absolute left-3 top-24 z-900 w-60 rounded-md border bg-card/95 px-3 py-3 shadow"
      >
        <TypographySmall as="p" class="text-xs font-medium">Area Analytics</TypographySmall>
        <TypographyMuted as="p" class="mt-1 text-xs">
          Draw a zone on the map, then analyze the area.
        </TypographyMuted>
        <Button size="sm" class="mt-3 w-full" @click="startDrawing">
          <PencilRuler class="h-3.5 w-3.5" />
          <TypographySmall as="span">Draw zone</TypographySmall>
        </Button>
      </div>

      <SmartAnalysisToolbar
        v-if="analysis.isActive.value"
        :is-drawing="analysis.drawing.isDrawing.value"
        :has-area="analysis.drawing.hasArea.value"
        :can-analyze="analysis.drawing.canAnalyze.value"
        :point-count="analysis.drawing.points.value.length"
        @toggle-draw="toggleDraw"
        @undo="analysis.drawing.undoLastPoint"
        @clear="analysis.resetAll"
        @analyze="analysis.openOptions"
      />

      <AreaAnalysisDrawer
        :step="analysis.step.value"
        :area-summary="analysis.areaSummary.value"
        :selected-option="analysis.selectedOption.value"
        @close="analysis.closeFlow"
        @back="analysis.backToOptions"
        @select="analysis.chooseOption"
        @submit-business-suitability="analysis.runBusinessSuitability"
        @submit-top-businesses="analysis.runTopBusinesses"
        @submit-nearest-suppliers="analysis.runNearestSuppliers"
        @submit-nearest-spaces="analysis.runNearestSpaces"
      />

      <SuitabilityReportModal
        :open="analysis.isReportOpen.value"
        :report="analysis.report.value"
        @close="analysis.closeReport"
      />

      <TopBusinessesReportModal
        :open="analysis.isTopBusinessesReportOpen.value"
        :report="analysis.topBusinessesReport.value"
        @close="analysis.closeReport"
      />

      <NearestSuppliersReportModal
        :open="analysis.isSuppliersReportOpen.value"
        :report="analysis.suppliersReport.value"
        @close="analysis.closeReport"
        @focus="focusOnLocation"
      />

      <NearestSpacesReportModal
        :open="analysis.isSpacesReportOpen.value"
        :report="analysis.spacesReport.value"
        @close="analysis.closeReport"
        @focus="focusOnLocation"
      />
    </div>
  </div>
</template>
