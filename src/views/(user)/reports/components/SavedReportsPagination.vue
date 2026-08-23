<script setup lang="ts">
import { computed } from 'vue'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { TypographyMuted } from '@/components/typography'
import type { SavedAnalysisReport } from '@/types/smart-analysis.types'
import type { Table } from '@tanstack/vue-table'

// Page summary plus the shadcn pager. Page count stays tiny (archive caps at
// 20 reports), so plain numbered links are enough — no ellipsis logic.
const props = defineProps<{
  table: Table<SavedAnalysisReport>
}>()

const pageCount = computed(() => props.table.getPageCount())
const pageIndex = computed(() => props.table.getState().pagination.pageIndex)

const rangeLabel = computed(() => {
  const total = props.table.getFilteredRowModel().rows.length
  if (total === 0) {
    return 'No reports'
  }

  const pageSize = props.table.getState().pagination.pageSize
  const start = pageIndex.value * pageSize + 1
  const end = Math.min(start + pageSize - 1, total)
  return `Showing ${start}–${end} of ${total}`
})

const pageNumbers = computed(() => Array.from({ length: pageCount.value }, (_, index) => index))

function goToPage(page: number): void {
  props.table.setPageIndex(Math.min(Math.max(page, 0), pageCount.value - 1))
}
</script>

<template>
  <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
    <TypographyMuted as="p" class="text-xs">{{ rangeLabel }}</TypographyMuted>

    <Pagination class="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationPrevious
          href="#"
          :aria-disabled="!table.getCanPreviousPage()"
          :class="{ 'pointer-events-none opacity-50': !table.getCanPreviousPage() }"
          @click.prevent="goToPage(table.getState().pagination.pageIndex - 1)"
        />

        <PaginationItem v-for="page in pageNumbers" :key="page">
          <PaginationLink
            href="#"
            :is-active="page === table.getState().pagination.pageIndex"
            @click.prevent="goToPage(page)"
          >
            {{ page + 1 }}
          </PaginationLink>
        </PaginationItem>

        <PaginationNext
          href="#"
          :aria-disabled="!table.getCanNextPage()"
          :class="{ 'pointer-events-none opacity-50': !table.getCanNextPage() }"
          @click.prevent="goToPage(table.getState().pagination.pageIndex + 1)"
        />
      </PaginationContent>
    </Pagination>
  </div>
</template>
