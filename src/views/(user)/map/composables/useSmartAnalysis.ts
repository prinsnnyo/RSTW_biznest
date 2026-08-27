import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { DEFAULT_LOCATION_LABEL } from '@/views/(user)/map/constants'
import { buildNearestSpacesReport } from '@/views/(user)/map/utils/nearestSpacesReport.utils'
import { buildNearestSuppliersReport } from '@/views/(user)/map/utils/nearestSuppliersReport.utils'
import { buildSuitabilityReport } from '@/views/(user)/map/utils/suitabilityReport.utils'
import { buildTopBusinessesReport } from '@/views/(user)/map/utils/topBusinessesReport.utils'
import type {
  AnalysisOptionKey,
  BusinessSuitabilityInput,
  NearestSpacesInput,
  NearestSuppliersInput,
  NearestSpacesReport,
  NearestSuppliersReport,
  SmartAnalysisStep,
  SuitabilityReport,
  TopBusinessesInput,
  TopBusinessesReport,
} from '@/types/smart-analysis.types'
import { useAreaDrawing, type UseAreaDrawingReturn } from '@/views/(user)/map/composables/useAreaDrawing'

// Report building is instant (client-side only), but a bare instant flip to
// the report feels like the click did nothing — hold the "running analysis"
// state for a beat so the spinner actually registers.
const ANALYSIS_DELAY_MS = 5000

export interface UseSmartAnalysisReturn {
  drawing: UseAreaDrawingReturn
  step: Ref<SmartAnalysisStep>
  isActive: ComputedRef<boolean>
  isAnalyzing: Ref<boolean>
  selectedOption: Ref<AnalysisOptionKey | null>
  report: Ref<SuitabilityReport | null>
  topBusinessesReport: Ref<TopBusinessesReport | null>
  suppliersReport: Ref<NearestSuppliersReport | null>
  spacesReport: Ref<NearestSpacesReport | null>
  isReportOpen: ComputedRef<boolean>
  isTopBusinessesReportOpen: ComputedRef<boolean>
  isSuppliersReportOpen: ComputedRef<boolean>
  isSpacesReportOpen: ComputedRef<boolean>
  areaSummary: ComputedRef<string>
  isOptionsOpen: ComputedRef<boolean>
  isFormOpen: ComputedRef<boolean>
  beginDrawing: () => void
  finishDrawing: () => void
  openOptions: () => void
  chooseOption: (key: AnalysisOptionKey) => void
  backToOptions: () => void
  closeFlow: () => void
  closeReport: () => void
  dismissReports: () => void
  resetAll: () => void
  runBusinessSuitability: (input: BusinessSuitabilityInput) => void
  runTopBusinesses: (input: TopBusinessesInput) => void
  runNearestSuppliers: (input: NearestSuppliersInput) => void
  runNearestSpaces: (input: NearestSpacesInput) => void
}

export function useSmartAnalysis(): UseSmartAnalysisReturn {
  const authStore = useAuthStore()
  const drawing = useAreaDrawing()

  const step = ref<SmartAnalysisStep>('idle')
  const isAnalyzing = ref(false)
  let analyzingTimeoutId: number | null = null
  const selectedOption = ref<AnalysisOptionKey | null>(null)
  const report = ref<SuitabilityReport | null>(null)
  const topBusinessesReport = ref<TopBusinessesReport | null>(null)
  const suppliersReport = ref<NearestSuppliersReport | null>(null)
  const spacesReport = ref<NearestSpacesReport | null>(null)

  const locationLabel = computed(() => {
    const cityName = authStore.user?.user_metadata?.city_name
    return typeof cityName === 'string' && cityName.trim().length > 0
      ? cityName.trim()
      : DEFAULT_LOCATION_LABEL
  })

  const areaSummary = computed(
    () => `${drawing.points.value.length} boundary points · ${locationLabel.value}`,
  )

  /** The tool is engaged the moment the user leaves the idle state. */
  const isActive = computed(() => step.value !== 'idle')

  const isOptionsOpen = computed(() => step.value === 'choosing')
  const isFormOpen = computed(() => step.value === 'form')
  const isReportOpen = computed(() => step.value === 'report' && report.value !== null)
  const isTopBusinessesReportOpen = computed(
    () => step.value === 'report' && topBusinessesReport.value !== null,
  )
  const isSuppliersReportOpen = computed(
    () => step.value === 'report' && suppliersReport.value !== null,
  )
  const isSpacesReportOpen = computed(
    () => step.value === 'report' && spacesReport.value !== null,
  )

  function cancelAnalyzing(): void {
    if (analyzingTimeoutId !== null) {
      window.clearTimeout(analyzingTimeoutId)
      analyzingTimeoutId = null
    }
    isAnalyzing.value = false
  }

  /** Runs `build` after a short "analyzing" delay, then flips to the report step. */
  function runAnalysis(build: () => void): void {
    if (isAnalyzing.value) {
      return
    }

    clearReports()
    isAnalyzing.value = true
    analyzingTimeoutId = window.setTimeout(() => {
      analyzingTimeoutId = null
      build()
      step.value = 'report'
      isAnalyzing.value = false
    }, ANALYSIS_DELAY_MS)
  }

  function beginDrawing(): void {
    cancelAnalyzing()
    clearReports()
    selectedOption.value = null
    drawing.clearArea()
    drawing.startDrawing()
    step.value = 'drawing'
  }

  function finishDrawing(): void {
    drawing.stopDrawing()
    step.value = 'drawn'
  }

  function openOptions(): void {
    if (!drawing.canAnalyze.value) {
      return
    }

    drawing.stopDrawing()
    step.value = 'choosing'
  }

  function chooseOption(key: AnalysisOptionKey): void {
    selectedOption.value = key
    step.value = 'form'
  }

  function backToOptions(): void {
    cancelAnalyzing()
    selectedOption.value = null
    step.value = 'choosing'
  }

  /** Dismiss the current panel but keep the drawn area on the map. */
  function closeFlow(): void {
    cancelAnalyzing()
    step.value = drawing.hasArea.value ? 'drawn' : 'idle'
  }

  function resetAll(): void {
    cancelAnalyzing()
    drawing.clearArea()
    selectedOption.value = null
    clearReports()
    selectedOption.value = null
    step.value = 'idle'
  }

  /** Closing a report drops back to the option list, not out of the tool. */
  function clearReports(): void {
    report.value = null
    topBusinessesReport.value = null
    suppliersReport.value = null
    spacesReport.value = null
  }

  function closeReport(): void {
    clearReports()
    step.value = 'choosing'
  }

  /** Clear every open report without reopening the option list. */
  function dismissReports(): void {
    clearReports()
    step.value = 'drawn'
  }

  function runBusinessSuitability(input: BusinessSuitabilityInput): void {
    runAnalysis(() => {
      report.value = buildSuitabilityReport(
        input,
        areaSummary.value,
        new Date().toLocaleString('en-PH'),
        crypto.randomUUID().slice(0, 8),
      )
    })
  }

  function runTopBusinesses(input: TopBusinessesInput): void {
    runAnalysis(() => {
      topBusinessesReport.value = buildTopBusinessesReport(
        input,
        areaSummary.value,
        new Date().toLocaleString('en-PH'),
        crypto.randomUUID().slice(0, 8),
      )
    })
  }

  function runNearestSuppliers(input: NearestSuppliersInput): void {
    runAnalysis(() => {
      suppliersReport.value = buildNearestSuppliersReport(
        input,
        drawing.points.value,
        areaSummary.value,
        new Date().toLocaleString('en-PH'),
        crypto.randomUUID().slice(0, 8),
      )
    })
  }

  function runNearestSpaces(input: NearestSpacesInput): void {
    runAnalysis(() => {
      spacesReport.value = buildNearestSpacesReport(
        input,
        drawing.points.value,
        areaSummary.value,
        new Date().toLocaleString('en-PH'),
        crypto.randomUUID().slice(0, 8),
      )
    })
  }

  return {
    drawing,
    step,
    isActive,
    isAnalyzing,
    selectedOption,
    report,
    topBusinessesReport,
    suppliersReport,
    spacesReport,
    isReportOpen,
    isTopBusinessesReportOpen,
    isSuppliersReportOpen,
    isSpacesReportOpen,
    areaSummary,
    isOptionsOpen,
    isFormOpen,
    beginDrawing,
    finishDrawing,
    openOptions,
    chooseOption,
    backToOptions,
    closeFlow,
    closeReport,
    dismissReports,
    resetAll,
    runBusinessSuitability,
    runTopBusinesses,
    runNearestSuppliers,
    runNearestSpaces,
  }
}
