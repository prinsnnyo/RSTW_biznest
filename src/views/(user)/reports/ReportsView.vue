<script setup lang="ts">
import { BookmarkCheck } from 'lucide-vue-next'
import NearestSpacesReportModal from '@/components/smart-analysis/NearestSpacesReportModal.vue'
import NearestSuppliersReportModal from '@/components/smart-analysis/NearestSuppliersReportModal.vue'
import SuitabilityReportModal from '@/components/smart-analysis/SuitabilityReportModal.vue'
import TopBusinessesReportModal from '@/components/smart-analysis/TopBusinessesReportModal.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TypographyH2, TypographyMuted } from '@/components/typography'
import SavedReportsPagination from './components/SavedReportsPagination.vue'
import SavedReportsTable from './components/SavedReportsTable.vue'
import SavedReportsToolbar from './components/SavedReportsToolbar.vue'
import { useSavedReportsPage } from './composables/useSavedReportsPage'

// Archive of the four smart-analysis result types. Reports stay in
// localStorage; this page only reads, reopens and deletes them.
const page = useSavedReportsPage()
</script>

<template>
  <section class="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <span class="bg-primary/10 text-primary mt-0.5 rounded-lg p-2.5">
          <BookmarkCheck class="h-5 w-5" />
        </span>
        <div class="space-y-1">
          <TypographyH2>Saved Reports</TypographyH2>
          <TypographyMuted>
            Results you saved from Smart Analysis on the map, across all four analysis types.
          </TypographyMuted>
        </div>
      </div>
      <Badge variant="secondary" class="bg-primary/10 text-primary shrink-0 border-none px-3 py-1">
        {{ page.totalCount.value }} saved
      </Badge>
    </div>

    <Card class="gap-4 rounded-xl p-4 md:p-5">
      <SavedReportsToolbar
        v-model:search-query="page.searchQuery.value"
        v-model:type-filter="page.typeFilter.value"
        :selected-count="page.selectedCount.value"
        @delete-selected="page.requestDeleteSelected"
      />

      <SavedReportsTable :table="page.table" @open="page.openReport" @delete="page.requestDelete" />

      <SavedReportsPagination
        v-if="page.filteredCount.value > 0"
        :table="page.table"
      />
    </Card>

    <ConfirmDeleteModal
      v-model:is-open="page.confirmDeleteOpen.value"
      title="Delete saved report?"
      description="This only removes the report from this browser — map results are not affected."
      :item-type="page.pendingDeleteTitle.value"
      :action="page.confirmDeleteAction"
    />

    <SuitabilityReportModal
      :open="page.activeSuitability.value !== null"
      :report="page.activeSuitability.value"
      @close="page.closeReport"
    />
    <TopBusinessesReportModal
      :open="page.activeTopBusinesses.value !== null"
      :report="page.activeTopBusinesses.value"
      @close="page.closeReport"
    />
    <NearestSuppliersReportModal
      :open="page.activeSuppliers.value !== null"
      :report="page.activeSuppliers.value"
      @close="page.closeReport"
    />
    <NearestSpacesReportModal
      :open="page.activeSpaces.value !== null"
      :report="page.activeSpaces.value"
      @close="page.closeReport"
    />
  </section>
</template>
