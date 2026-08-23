import type { AnalysisOptionKey, SavedAnalysisReport } from '@/types/smart-analysis.types'

export type ReportTypeFilter = 'all' | AnalysisOptionKey

/** Display metadata for each of the four smart-analysis result kinds. */
export const REPORT_TYPE_META: Record<AnalysisOptionKey, { label: string; description: string }> =
  {
    'business-suitability': {
      label: 'Business Suitability',
      description: 'Fit of a planned business in a drawn area',
    },
    'top-businesses': {
      label: 'Top 5 Businesses',
      description: 'Highest-potential businesses in a drawn area',
    },
    'nearest-suppliers': {
      label: 'Nearest Suppliers',
      description: 'Supplier matches around a drawn area',
    },
    'nearest-spaces': {
      label: 'Spaces for Rent / Sale',
      description: 'Commercial space listings near a drawn area',
    },
  }

export const REPORT_TYPE_KEYS = Object.keys(REPORT_TYPE_META) as AnalysisOptionKey[]

export function isReportTypeFilter(value: string): value is ReportTypeFilter {
  return value === 'all' || (REPORT_TYPE_KEYS as string[]).includes(value)
}

export function reportTypeLabel(report: SavedAnalysisReport): string {
  return REPORT_TYPE_META[report.kind].label
}

export function formatReportTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
