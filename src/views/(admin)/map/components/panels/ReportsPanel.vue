<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyMuted, TypographyP, TypographySmall } from '@/components/typography'
import { useAdminMapStore } from '@/stores/admin.map.store'
import { useReports } from '@/views/(admin)/reports/composables/useReports'
import TabAndExportButtons from '@/views/(admin)/reports/components/TabAndExportButtons.vue'
import ReportTable from '@/views/(admin)/reports/components/ReportTable.vue'

const adminMapStore = useAdminMapStore()
const { value, tabs, loading, error, currentTab, canExport, handleTabChange, handleExport } =
  useReports()

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

          <Button variant="ghost" size="icon-sm" @click="close">
            <X class="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent class="flex-1 overflow-y-auto p-0">
        <TypographyMuted v-if="loading" as="p" class="px-4 pt-3 text-xs">
          Loading reports…
        </TypographyMuted>
        <TypographySmall v-else-if="error" as="p" class="px-4 pt-3 text-xs text-destructive">
          {{ error }}
        </TypographySmall>

        <template v-else>
          <TabAndExportButtons
            :tabs="tabs"
            :value="value"
            :can-export="canExport"
            @change="handleTabChange"
            @export="handleExport"
          />
          <div class="p-2">
            <ReportTable :table-data="currentTab?.tableData" :content="currentTab?.content" />
          </div>
        </template>
      </CardContent>
    </Card>
  </aside>
</template>
