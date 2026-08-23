import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useVueTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type Table,
} from '@tanstack/vue-table'
import { useSavedReports } from '@/composables/useSavedReports'
import { useAlertContext } from '@/composables/useAlert'
import type {
  NearestSpacesReport,
  NearestSuppliersReport,
  SavedAnalysisReport,
  SuitabilityReport,
  TopBusinessesReport,
} from '@/types/smart-analysis.types'
import { reportTypeLabel, type ReportTypeFilter } from '../utils/reportMeta.utils'
import { DEMO_ID_PREFIX, DEMO_REPORTS } from '../utils/demoReports'

export const REPORTS_PAGE_SIZE = 8

export interface UseSavedReportsPageReturn {
  searchQuery: Ref<string>
  typeFilter: Ref<ReportTypeFilter>
  filteredCount: ComputedRef<number>
  totalCount: ComputedRef<number>
  table: Table<SavedAnalysisReport>
  selectedCount: ComputedRef<number>
  activeSuitability: ComputedRef<SuitabilityReport | null>
  activeTopBusinesses: ComputedRef<TopBusinessesReport | null>
  activeSuppliers: ComputedRef<NearestSuppliersReport | null>
  activeSpaces: ComputedRef<NearestSpacesReport | null>
  openReport: (report: SavedAnalysisReport) => void
  closeReport: () => void
  requestDelete: (report: SavedAnalysisReport) => void
  requestDeleteSelected: () => void
  pendingDeleteCount: ComputedRef<number>
  pendingDeleteTitle: ComputedRef<string>
  confirmDeleteOpen: Ref<boolean>
  confirmDeleteAction: () => Promise<void>
}

export function useSavedReportsPage(): UseSavedReportsPageReturn {
  const { savedReports, removeReport } = useSavedReports()
  const { showSuccess } = useAlertContext()

  const searchQuery = ref('')
  const typeFilter = ref<ReportTypeFilter>('all')
  const activeReport = ref<SavedAnalysisReport | null>(null)

  // Demo rows sit on top of real saves until the user deletes them in this
  // session; hidden demo rows come back only after a full reload.
  const hiddenDemoIds = ref<Set<string>>(new Set())

  const mergedReports = computed(() => [
    ...DEMO_REPORTS.filter((report) => !hiddenDemoIds.value.has(report.id)),
    ...savedReports.value,
  ])

  const filteredReports = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    return mergedReports.value.filter((report) => {
      if (typeFilter.value !== 'all' && report.kind !== typeFilter.value) {
        return false
      }
      if (query.length === 0) {
        return true
      }
      return (
        report.areaSummary.toLowerCase().includes(query) ||
        reportTypeLabel(report).toLowerCase().includes(query)
      )
    })
  })

  const columns: ColumnDef<SavedAnalysisReport>[] = [
    { id: 'select', enableSorting: false, enableHiding: false },
    { accessorKey: 'kind', header: 'Type' },
    { accessorKey: 'areaSummary', header: 'Area' },
    { accessorKey: 'generatedAt', header: 'Saved' },
    { id: 'actions', enableSorting: false, enableHiding: false },
  ]

  const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: REPORTS_PAGE_SIZE })
  const rowSelection = ref<RowSelectionState>({})

  // Filtered output drives the table; row ids are the report ids so selection
  // survives filtering and paging.
  const table = useVueTable({
    get data() {
      return filteredReports.value
    },
    columns,
    state: {
      get pagination() {
        return pagination.value
      },
      get rowSelection() {
        return rowSelection.value
      },
    },
    getRowId: (row) => row.id,
    onPaginationChange: (updater) => {
      pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater
    },
    onRowSelectionChange: (updater) => {
      rowSelection.value = typeof updater === 'function' ? updater(rowSelection.value) : updater
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Keep the page in range when filters shrink the result set.
  watch(filteredReports, (rows) => {
    const lastPage = Math.max(0, table.getPageCount() - 1)
    if (pagination.value.pageIndex > lastPage) {
      pagination.value = { ...pagination.value, pageIndex: lastPage }
    }
  })

  const selectedIds = computed(() =>
    mergedReports.value
      .filter((report) => rowSelection.value[report.id])
      .map((report) => report.id),
  )

  const selectedCount = computed(() => selectedIds.value.length)
  const filteredCount = computed(() => filteredReports.value.length)
  const totalCount = computed(() => mergedReports.value.length)

  const activeSuitability = computed(() =>
    activeReport.value?.kind === 'business-suitability' ? activeReport.value : null,
  )
  const activeTopBusinesses = computed(() =>
    activeReport.value?.kind === 'top-businesses' ? activeReport.value : null,
  )
  const activeSuppliers = computed(() =>
    activeReport.value?.kind === 'nearest-suppliers' ? activeReport.value : null,
  )
  const activeSpaces = computed(() =>
    activeReport.value?.kind === 'nearest-spaces' ? activeReport.value : null,
  )

  function openReport(report: SavedAnalysisReport): void {
    activeReport.value = report
  }

  function closeReport(): void {
    activeReport.value = null
  }

  function forgetSelection(ids: string[]): void {
    for (const id of ids) {
      delete rowSelection.value[id]
    }
    rowSelection.value = { ...rowSelection.value }
  }

  const confirmDeleteOpen = ref(false)
  const pendingDeleteIds = ref<string[]>([])

  const pendingDeleteCount = computed(() => pendingDeleteIds.value.length)
  const pendingDeleteTitle = computed(() =>
    pendingDeleteIds.value.length === 1 ? 'this saved report' : `${pendingDeleteIds.value.length} saved reports`,
  )

  function requestDelete(report: SavedAnalysisReport): void {
    pendingDeleteIds.value = [report.id]
    confirmDeleteOpen.value = true
  }

  function requestDeleteSelected(): void {
    pendingDeleteIds.value = [...selectedIds.value]
    confirmDeleteOpen.value = true
  }

  async function confirmDeleteAction(): Promise<void> {
    const ids = pendingDeleteIds.value
    const demoIds = ids.filter((id) => id.startsWith(DEMO_ID_PREFIX))
    for (const id of demoIds) {
      hiddenDemoIds.value = new Set(hiddenDemoIds.value).add(id)
    }
    for (const id of ids.filter((id) => !demoIds.includes(id))) {
      removeReport(id)
    }
    forgetSelection(ids)
    pendingDeleteIds.value = []
    showSuccess(
      ids.length === 1
        ? 'The saved report was removed.'
        : `${ids.length} saved reports were removed.`,
      { title: 'Report deleted' },
    )
  }

  return {
    searchQuery,
    typeFilter,
    filteredCount,
    totalCount,
    table,
    selectedCount,
    activeSuitability,
    activeTopBusinesses,
    activeSuppliers,
    activeSpaces,
    openReport,
    closeReport,
    requestDelete,
    requestDeleteSelected,
    pendingDeleteCount,
    pendingDeleteTitle,
    confirmDeleteOpen,
    confirmDeleteAction,
  }
}
