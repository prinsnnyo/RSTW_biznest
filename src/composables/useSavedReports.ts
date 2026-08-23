import { ref, type Ref } from 'vue'
import type { SavedAnalysisReport } from '@/types/smart-analysis.types'

// Saved reports live in the browser only. There is no reports table for
// smart-analysis output yet, so "Save Report" persists to localStorage rather
// than pretending to reach a backend.
const STORAGE_KEY = 'biznest:user-map:saved-analysis-reports'
const MAX_SAVED = 20

function loadSaved(): SavedAnalysisReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedAnalysisReport[]) : []
  } catch {
    return []
  }
}

function persist(reports: SavedAnalysisReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  } catch {
    // Storage unavailable (private mode, quota) — saving is best-effort.
  }
}

export interface UseSavedReportsReturn {
  savedReports: Ref<SavedAnalysisReport[]>
  isSaved: (id: string) => boolean
  saveReport: (report: SavedAnalysisReport) => void
  removeReport: (id: string) => void
}

export function useSavedReports(): UseSavedReportsReturn {
  const savedReports = ref<SavedAnalysisReport[]>(loadSaved())

  function isSaved(id: string): boolean {
    return savedReports.value.some((report) => report.id === id)
  }

  function saveReport(report: SavedAnalysisReport): void {
    if (isSaved(report.id)) {
      return
    }

    savedReports.value = [report, ...savedReports.value].slice(0, MAX_SAVED)
    persist(savedReports.value)
  }

  function removeReport(id: string): void {
    savedReports.value = savedReports.value.filter((report) => report.id !== id)
    persist(savedReports.value)
  }

  return { savedReports, isSaved, saveReport, removeReport }
}
