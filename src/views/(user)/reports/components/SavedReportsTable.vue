<script setup lang="ts">
import type { Component } from 'vue'
import { Eye, MoreHorizontal, Store, Target, Trash2, Truck, Warehouse } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import type { AnalysisOptionKey, SavedAnalysisReport } from '@/types/smart-analysis.types'
import type { Table as TanStackTable } from '@tanstack/vue-table'
import { formatReportTimestamp, REPORT_TYPE_META } from '../utils/reportMeta.utils'

// Saved smart-analysis results: checkbox selection, per-row actions, and a
// click anywhere else on the row to reopen that report's modal.
defineProps<{
  table: TanStackTable<SavedAnalysisReport>
}>()

const emit = defineEmits<{
  open: [report: SavedAnalysisReport]
  delete: [report: SavedAnalysisReport]
}>()

const typeIcons: Record<AnalysisOptionKey, Component> = {
  'business-suitability': Target,
  'top-businesses': Store,
  'nearest-suppliers': Truck,
  'nearest-spaces': Warehouse,
}

// One theme-tinted chip colour per analysis kind, so the rows read at a glance.
const typeTones: Record<AnalysisOptionKey, string> = {
  'business-suitability': 'bg-chart-1/10 text-chart-1',
  'top-businesses': 'bg-success/10 text-success',
  'nearest-suppliers': 'bg-accent/15 text-accent',
  'nearest-spaces': 'bg-chart-2/10 text-chart-2',
}
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="w-10">
            <Checkbox
              :model-value="table.getIsAllPageRowsSelected()"
              :aria-label="'Select all rows on this page'"
              @update:model-value="table.toggleAllPageRowsSelected(!!$event)"
            />
          </TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Area</TableHead>
          <TableHead>Saved</TableHead>
          <TableHead class="w-12 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow v-if="table.getRowModel().rows.length === 0">
          <TableCell colspan="5" class="h-32 text-center">
            <TypographyMuted as="p">
              No saved reports yet. Draw an area on the map and run Smart Analysis.
            </TypographyMuted>
          </TableCell>
        </TableRow>

        <TableRow
          v-for="row in table.getRowModel().rows"
          :key="row.id"
          class="cursor-pointer border-border/70 data-[state=selected]:bg-primary/5"
          :data-state="row.getIsSelected() ? 'selected' : undefined"
          @click="emit('open', row.original)"
        >
          <TableCell class="w-10" @click.stop>
            <Checkbox
              :model-value="row.getIsSelected()"
              :aria-label="`Select report from ${formatReportTimestamp(row.original.generatedAt)}`"
              @update:model-value="row.toggleSelected(!!$event)"
            />
          </TableCell>

          <TableCell class="min-w-40">
            <span class="flex items-center gap-2">
              <span
                :class="typeTones[row.original.kind]"
                class="rounded-md p-1.5"
              >
                <component :is="typeIcons[row.original.kind]" class="h-4 w-4" />
              </span>
              <TypographySmall as="span" class="font-semibold">
                {{ REPORT_TYPE_META[row.original.kind].label }}
              </TypographySmall>
            </span>
          </TableCell>

          <TableCell class="max-w-72">
            <TypographyMuted as="p" class="truncate">{{ row.original.areaSummary }}</TypographyMuted>
          </TableCell>

          <TableCell class="whitespace-nowrap">
            <TypographyMuted as="span">{{ formatReportTimestamp(row.original.generatedAt) }}</TypographyMuted>
          </TableCell>

          <TableCell class="w-12 text-right" @click.stop>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="emit('open', row.original)">
                  <Eye class="h-4 w-4" />
                  View report
                </DropdownMenuItem>
                <DropdownMenuItem class="text-destructive focus:text-destructive" @click="emit('delete', row.original)">
                  <Trash2 class="h-4 w-4" />
                  Delete report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
