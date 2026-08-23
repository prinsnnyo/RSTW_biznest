import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue'
import { useAdminMapStore } from '@/stores/admin.map.store'
import type { MapDrawPoint } from '@/types/zoning.types'
import { MIN_AREA_POINTS } from '@/views/(user)/map/constants'

export interface UseAreaDrawingReturn {
  points: Ref<MapDrawPoint[]>
  isDrawing: Ref<boolean>
  canAnalyze: ComputedRef<boolean>
  hasArea: ComputedRef<boolean>
  startDrawing: () => void
  stopDrawing: () => void
  undoLastPoint: () => void
  clearArea: () => void
}

/**
 * Polygon capture for the smart-analysis flow. It drives the canvas directly
 * rather than the admin store's draw machine, which is wired to zoning and
 * hazard editing that normal users never reach.
 */
export function useAreaDrawing(): UseAreaDrawingReturn {
  const adminMapStore = useAdminMapStore()

  const points = ref<MapDrawPoint[]>([])
  const isDrawing = ref(false)

  const canAnalyze = computed(() => points.value.length >= MIN_AREA_POINTS)
  const hasArea = computed(() => points.value.length > 0)

  function renderPreview(): void {
    void adminMapStore.mapRef?.renderDrawPreview(points.value)
  }

  function handleMapClick(point: MapDrawPoint): void {
    points.value = [...points.value, point]
    renderPreview()
  }

  function bindMapClick(enabled: boolean): void {
    adminMapStore.mapRef?.setDrawMode(enabled)
    adminMapStore.mapRef?.setMapClickHandler(enabled ? handleMapClick : null)
  }

  function startDrawing(): void {
    isDrawing.value = true
    bindMapClick(true)
  }

  function stopDrawing(): void {
    isDrawing.value = false
    bindMapClick(false)
  }

  function undoLastPoint(): void {
    points.value = points.value.slice(0, -1)
    renderPreview()
  }

  function clearArea(): void {
    points.value = []
    renderPreview()
    stopDrawing()
  }

  onScopeDispose(() => {
    bindMapClick(false)
    void adminMapStore.mapRef?.renderDrawPreview([])
  })

  return {
    points,
    isDrawing,
    canAnalyze,
    hasArea,
    startDrawing,
    stopDrawing,
    undoLastPoint,
    clearArea,
  }
}
