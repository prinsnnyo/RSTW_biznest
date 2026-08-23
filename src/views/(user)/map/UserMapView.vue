<script setup lang="ts">
import UserMapShell from '@/components/map/UserMapShell.vue'
import AreaAnalysisDrawer from '@/views/(user)/map/components/AreaAnalysisDrawer.vue'
import SmartAnalysisToolbar from '@/views/(user)/map/components/SmartAnalysisToolbar.vue'
import SuitabilityReportModal from '@/views/(user)/map/components/SuitabilityReportModal.vue'
import TopBusinessesReportModal from '@/views/(user)/map/components/TopBusinessesReportModal.vue'
import UserMapRightSideBar from '@/views/(user)/map/components/UserMapRightSideBar.vue'
import { useSmartAnalysis } from '@/views/(user)/map/composables/useSmartAnalysis'

const analysis = useSmartAnalysis()

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
      :result="analysis.result.value"
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

    <UserMapRightSideBar
      :active="analysis.isActive.value"
      @toggle-smart-analysis="toggleSmartAnalysis"
    />
  </UserMapShell>
</template>
