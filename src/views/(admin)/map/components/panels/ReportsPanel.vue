<script setup lang="ts">
import { Download, FileText, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TypographyMuted, TypographyP, TypographySmall } from '@/components/typography'
import { useAdminMapStore } from '@/stores/admin.map.store'
import { useReports } from '@/views/(admin)/reports/composables/useReports'
import { useReportExport } from '@/views/(admin)/reports/composables/useReportExport'
import TabAndExportButtons from '@/views/(admin)/reports/components/TabAndExportButtons.vue'
import ReportTable from '@/views/(admin)/reports/components/ReportTable.vue'

const adminMapStore = useAdminMapStore()
const { value, tabs, loading, error, currentTab, canExport, handleTabChange } = useReports()
const { exportToPdf, exportToCsv, exportToText, exportToWord } = useReportExport()

function handleExportFormat(format: 'pdf' | 'word' | 'text' | 'csv'): void {
  const tab = currentTab.value
  if (!canExport.value || !tab) {
    return
  }

  if (format === 'pdf') {
    exportToPdf(tab, tab.label)
  } else if (format === 'word') {
    exportToWord(tab, tab.label)
  } else if (format === 'text') {
    exportToText(tab, tab.label)
  } else {
    exportToCsv(tab, tab.label)
  }
}

function close(): void {
  adminMapStore.activePanel = null
}
</script>

<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l">
    <Card class="flex h-full flex-col rounded-none border-0 shadow-none py-0">
      <CardHeader class="shrink-0 border-b py-4">
        <CardTitle class="flex items-center justify-between text-base">
          <div class="flex items-center gap-2">
            <FileText class="h-4 w-4 text-sky-500" />
            <TypographyP as="span" class="m-0 leading-none">Reports</TypographyP>
          </div>

          <div class="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon-sm" title="Export report" :disabled="!canExport">
                  <Download class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="z-10002">
                <DropdownMenuItem @click="handleExportFormat('pdf')">Export as PDF</DropdownMenuItem>
                <DropdownMenuItem @click="handleExportFormat('word')">Export as Word</DropdownMenuItem>
                <DropdownMenuItem @click="handleExportFormat('text')">Export as Text</DropdownMenuItem>
                <DropdownMenuItem @click="handleExportFormat('csv')">Export as CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon-sm" @click="close">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent class="flex-1 overflow-hidden p-0">
        <TypographyMuted v-if="loading" as="p" class="px-4 pt-3 text-xs">
          Loading reports…
        </TypographyMuted>
        <TypographySmall v-else-if="error" as="p" class="px-4 pt-3 text-xs text-destructive">
          {{ error }}
        </TypographySmall>

        <div v-else class="flex h-full flex-col">
          <TabAndExportButtons
            :tabs="tabs"
            :value="value"
            :can-export="canExport"
            hide-export
            class="shrink-0"
            @change="handleTabChange"
          />
          <div class="flex-1 overflow-y-auto p-2">
            <ReportTable :table-data="currentTab?.tableData" :content="currentTab?.content" />
          </div>
        </div>
      </CardContent>
    </Card>
  </aside>
</template>
