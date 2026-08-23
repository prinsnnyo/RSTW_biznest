<script setup lang="ts">
import { Search, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TypographySmall } from '@/components/typography'
import {
  REPORT_TYPE_META,
  REPORT_TYPE_KEYS,
  type ReportTypeFilter,
} from '../utils/reportMeta.utils'

// The "funnel" row: free-text search plus a per-type filter, and the bulk
// action that only appears once rows are checked.
defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  'delete-selected': []
}>()

const searchQuery = defineModel<string>('searchQuery', { required: true })
const typeFilter = defineModel<ReportTypeFilter>('typeFilter', { required: true })

function onSelectChange(value: unknown): void {
  if (typeof value === 'string' && ((REPORT_TYPE_KEYS as string[]).includes(value) || value === 'all')) {
    typeFilter.value = value as ReportTypeFilter
  }
}
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div class="relative w-full sm:max-w-xs">
      <Search
        class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
      />
      <Input v-model="searchQuery" placeholder="Search reports…" class="pl-9" />
    </div>

    <Select :model-value="typeFilter" @update:model-value="onSelectChange">
      <SelectTrigger size="sm" class="w-full sm:w-56">
        <SelectValue placeholder="All types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All types</SelectItem>
        <SelectItem v-for="key in REPORT_TYPE_KEYS" :key="key" :value="key">
          {{ REPORT_TYPE_META[key].label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Button
      v-if="selectedCount > 0"
      variant="outline"
      size="sm"
      class="text-destructive hover:bg-destructive/8 sm:ml-auto"
      @click="emit('delete-selected')"
    >
      <Trash2 class="h-4 w-4" />
      <TypographySmall as="span">Delete selected ({{ selectedCount }})</TypographySmall>
    </Button>
  </div>
</template>
