<script setup lang="ts">
import UserMapShell from '@/components/map/UserMapShell.vue'
import AreaAnalysisDrawer from '@/views/(user)/map/components/AreaAnalysisDrawer.vue'
import NearestSpacesReportModal from '@/components/smart-analysis/NearestSpacesReportModal.vue'
import NearestSuppliersReportModal from '@/components/smart-analysis/NearestSuppliersReportModal.vue'
import SmartAnalysisToolbar from '@/views/(user)/map/components/SmartAnalysisToolbar.vue'
import SuitabilityReportModal from '@/components/smart-analysis/SuitabilityReportModal.vue'
import TopBusinessesReportModal from '@/components/smart-analysis/TopBusinessesReportModal.vue'
import UserMapRightSideBar from '@/views/(user)/map/components/UserMapRightSideBar.vue'
import { useSmartAnalysis } from '@/views/(user)/map/composables/useSmartAnalysis'
import { useAdminMapStore } from '@/stores/admin.map.store'

const adminMapStore = useAdminMapStore()
const analysis = useSmartAnalysis()

// Jumping to a supplier only makes sense with the map visible, so the report
// steps aside — the drawn area stays put and the tool stays open.
function focusOnLocation(payload: { lat: number; lng: number; label: string }): void {
  analysis.dismissReports()
  void adminMapStore.mapRef?.focusLocation({ lat: payload.lat, lng: payload.lng }, payload.label)
}

// The strip toggles the whole tool: on turns drawing straight on, off wipes the
// area so the map goes back to plain browsing.
function toggleSmartAnalysis(): void {
  if (analysis.isActive.value) {
    analysis.resetAll()
    return
  }

  analysis.beginDrawing()
}

function toggleDraw(): void {
  if (analysis.drawing.isDrawing.value) {
    analysis.finishDrawing()
    return
  }

  analysis.beginDrawing()
}
</script>

<template>
  <UserMapShell inset-right>
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

    <UserMapRightSideBar
      :active="analysis.isActive.value"
      @toggle-smart-analysis="toggleSmartAnalysis"
    />
  </UserMapShell>
</template>
