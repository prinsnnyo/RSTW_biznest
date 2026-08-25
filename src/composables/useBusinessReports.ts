import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { REPORT_TABS } from '@/data/reports.data'
import { useReportExport } from '@/views/(admin)/reports/composables/useReportExport'
import type { Tab } from '@/types/reports.types'

export type ReportExportFormat = 'pdf' | 'word' | 'text' | 'csv'

export interface UseBusinessReportsReturn {
  tabs: Tab[]
  value: Ref<number>
  currentTab: ComputedRef<Tab | undefined>
  canExport: ComputedRef<boolean>
  handleTabChange: (index: number) => void
  handleExportFormat: (format: ReportExportFormat) => void
  handleExport: () => void
}

// Static business/zoning report rows (see src/data/reports.data.ts) shared by
// the admin map's ReportsPanel and the user-facing Saved Reports page.
export function useBusinessReports(): UseBusinessReportsReturn {
  const { exportToPdf, exportToCsv, exportToText, exportToWord } = useReportExport()

  const tabs = REPORT_TABS
  const value = ref(0)
  const currentTab = computed(() => tabs[value.value])
  const canExport = computed(() => (currentTab.value?.tableData?.length ?? 0) > 0)

  function handleTabChange(index: number): void {
    value.value = index
  }

  function handleExportFormat(format: ReportExportFormat): void {
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

  function handleExport(): void {
    handleExportFormat('pdf')
  }

  return { tabs, value, currentTab, canExport, handleTabChange, handleExportFormat, handleExport }
}
