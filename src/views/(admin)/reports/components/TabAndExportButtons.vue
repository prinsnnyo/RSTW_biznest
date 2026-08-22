<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { TabAndExportButtonsProps } from '@/types/reports.types'

defineProps<TabAndExportButtonsProps>()
const emit = defineEmits<{
  change: [index: number]
  export: []
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-3 border-b border-border">
    <div class="flex flex-1 gap-0 overflow-x-auto" role="tablist" aria-label="basic tabs example">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        role="tab"
        :id="`simple-tab-${index}`"
        :aria-controls="`simple-tabpanel-${index}`"
        :aria-selected="value === index"
        :class="[
          'relative shrink-0 border-none bg-transparent px-4 py-3 text-sm font-medium uppercase transition-colors cursor-pointer',
          value === index
            ? 'text-primary after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
            : 'text-muted-foreground hover:text-foreground/80',
        ]"
        @click="emit('change', index)"
      >
        {{ tab.label }}
      </button>
    </div>

    <Button
      v-if="!hideExport"
      type="button"
      size="sm"
      @click="emit('export')"
      :disabled="!canExport"
      class="mr-2 shrink-0"
      title="Export to PDF"
    >
      <Download :size="18" />
      <span>Export PDF</span>
    </Button>
  </div>
</template>
