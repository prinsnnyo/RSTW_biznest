<script setup lang="ts">
import { useBusinessReports } from '@/composables/useBusinessReports'
import ReportsHeader from './components/ReportsHeader.vue'
import TabAndExportButtons from './components/TabAndExportButtons.vue'
import ReportTable from './components/ReportTable.vue'

// Static placeholder data until this page has a real reports source — see
// src/data/reports.data.ts.
const { value, tabs, canExport, handleTabChange, handleExport } = useBusinessReports()
</script>

<template>
  <section class="w-full space-y-5 p-4 md:p-6">
    <ReportsHeader>
      <div class="space-y-5">
        <TabAndExportButtons
          :tabs="tabs"
          :value="value"
          :canExport="canExport"
          @change="handleTabChange"
          @export="handleExport"
        />
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          role="tabpanel"
          :hidden="value !== index"
          :id="`simple-tabpanel-${index}`"
          :aria-labelledby="`simple-tab-${index}`"
        >
          <ReportTable :table-data="tab.tableData" :content="tab.content" />
        </div>
      </div>
    </ReportsHeader>
  </section>
</template>
