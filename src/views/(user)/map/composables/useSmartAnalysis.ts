import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { DEFAULT_LOCATION_LABEL } from '@/views/(user)/map/constants'
import {
  buildNearestSpacesResult,
  buildNearestSuppliersResult,
} from '@/views/(user)/map/utils/mockAnalysis.utils'
import { buildSuitabilityReport } from '@/views/(user)/map/utils/suitabilityReport.utils'
import { buildTopBusinessesReport } from '@/views/(user)/map/utils/topBusinessesReport.utils'
import type {
  AnalysisOptionKey,
  AnalysisResult,
  BusinessSuitabilityInput,
  NearestSpacesInput,
  NearestSuppliersInput,
  SmartAnalysisStep,
  SuitabilityReport,
  TopBusinessesInput,
  TopBusinessesReport,
} from '@/views/(user)/map/types/smart-analysis.types'
import { useAreaDrawing, type UseAreaDrawingReturn } from '@/views/(user)/map/composables/useAreaDrawing'

export interface UseSmartAnalysisReturn {
  drawing: UseAreaDrawingReturn
  step: Ref<SmartAnalysisStep>
  isActive: ComputedRef<boolean>
  selectedOption: Ref<AnalysisOptionKey | null>
  result: Ref<AnalysisResult | null>
  report: Ref<SuitabilityReport | null>
  topBusinessesReport: Ref<TopBusinessesReport | null>
  isReportOpen: ComputedRef<boolean>
  isTopBusinessesReportOpen: ComputedRef<boolean>
  areaSummary: ComputedRef<string>
  isOptionsOpen: ComputedRef<boolean>
  isFormOpen: ComputedRef<boolean>
  isResultsOpen: ComputedRef<boolean>
  beginDrawing: () => void
  finishDrawing: () => void
  openOptions: () => void
  chooseOption: (key: AnalysisOptionKey) => void
  backToOptions: () => void
  closeFlow: () => void
  closeReport: () => void
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
  const selectedOption = ref<AnalysisOptionKey | null>(null)
  const result = ref<AnalysisResult | null>(null)
  const report = ref<SuitabilityReport | null>(null)
  const topBusinessesReport = ref<TopBusinessesReport | null>(null)

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
  const isResultsOpen = computed(() => step.value === 'results')
  const isReportOpen = computed(() => step.value === 'report' && report.value !== null)
  const isTopBusinessesReportOpen = computed(
    () => step.value === 'report' && topBusinessesReport.value !== null,
  )

  function beginDrawing(): void {
    result.value = null
    report.value = null
    topBusinessesReport.value = null
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
    selectedOption.value = null
    step.value = 'choosing'
  }

  /** Dismiss the current panel but keep the drawn area on the map. */
  function closeFlow(): void {
    step.value = drawing.hasArea.value ? 'drawn' : 'idle'
  }

  function resetAll(): void {
    drawing.clearArea()
    selectedOption.value = null
    result.value = null
    report.value = null
    topBusinessesReport.value = null
    step.value = 'idle'
  }

  /** Closing a report drops back to the option list, not out of the tool. */
  function closeReport(): void {
    report.value = null
    topBusinessesReport.value = null
    step.value = 'choosing'
  }

  function showResult(next: AnalysisResult): void {
    result.value = next
    step.value = 'results'
  }

  function runBusinessSuitability(input: BusinessSuitabilityInput): void {
    topBusinessesReport.value = null
    report.value = buildSuitabilityReport(
      input,
      areaSummary.value,
      new Date().toLocaleString('en-PH'),
      crypto.randomUUID().slice(0, 8),
    )
    step.value = 'report'
  }

  function runTopBusinesses(input: TopBusinessesInput): void {
    report.value = null
    topBusinessesReport.value = buildTopBusinessesReport(
      input,
      areaSummary.value,
      new Date().toLocaleString('en-PH'),
      crypto.randomUUID().slice(0, 8),
    )
    step.value = 'report'
  }

  function runNearestSuppliers(input: NearestSuppliersInput): void {
    showResult(buildNearestSuppliersResult(input))
  }

  function runNearestSpaces(input: NearestSpacesInput): void {
    showResult(buildNearestSpacesResult(input))
  }

  return {
    drawing,
    step,
    isActive,
    selectedOption,
    result,
    report,
    topBusinessesReport,
    isReportOpen,
    isTopBusinessesReportOpen,
    areaSummary,
    isOptionsOpen,
    isFormOpen,
    isResultsOpen,
    beginDrawing,
    finishDrawing,
    openOptions,
    chooseOption,
    backToOptions,
    closeFlow,
    closeReport,
    resetAll,
    runBusinessSuitability,
    runTopBusinesses,
    runNearestSuppliers,
    runNearestSpaces,
  }
}
