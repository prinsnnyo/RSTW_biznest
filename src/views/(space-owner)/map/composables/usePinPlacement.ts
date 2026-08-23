import { onScopeDispose, ref, type Ref } from 'vue'
import { useAdminMapStore } from '@/stores/admin.map.store'
import type { MapDrawPoint } from '@/types/zoning.types'
import type {
  Establishment,
  EstablishmentDraft,
} from '@/views/(space-owner)/map/types/establishment.types'

export interface UsePinPlacementReturn {
  establishments: Ref<Establishment[]>
  isPlacing: Ref<boolean>
  isModalOpen: Ref<boolean>
  pendingPoint: Ref<MapDrawPoint | null>
  startPlacement: () => void
  cancelPlacement: () => void
  closeModal: () => void
  submitPin: (draft: EstablishmentDraft) => boolean
}

/**
 * Space-owner "drop a pin" prototype. Placement is captured with the shared
 * map-click handler and pins live in memory only: pinned_locations has no
 * address or contact_number column, so nothing here is persisted yet.
 */
export function usePinPlacement(): UsePinPlacementReturn {
  const adminMapStore = useAdminMapStore()

  const establishments = ref<Establishment[]>([])
  const isPlacing = ref(false)
  const isModalOpen = ref(false)
  const pendingPoint = ref<MapDrawPoint | null>(null)

  function bindMapClick(enabled: boolean): void {
    // The draw cursor doubles as the placement cursor — the space-owner shell
    // has no draw tools of its own to fight over it.
    adminMapStore.mapRef?.setDrawMode(enabled)
    adminMapStore.mapRef?.setMapClickHandler(enabled ? handleMapClick : null)
  }

  function handleMapClick(point: MapDrawPoint): void {
    isPlacing.value = false
    // Stop listening while the form is up, so a stray click behind the modal
    // cannot move the point out from under the user.
    bindMapClick(false)
    pendingPoint.value = point
    isModalOpen.value = true
  }

  function startPlacement(): void {
    if (isPlacing.value) {
      return
    }

    isPlacing.value = true
    bindMapClick(true)
  }

  function cancelPlacement(): void {
    isPlacing.value = false
    bindMapClick(false)
  }

  function closeModal(): void {
    isModalOpen.value = false
    pendingPoint.value = null
  }

  function submitPin(draft: EstablishmentDraft): boolean {
    const point = pendingPoint.value
    const name = draft.name.trim()

    if (!point || name.length === 0) {
      return false
    }

    const establishment: Establishment = {
      ...draft,
      name,
      id: crypto.randomUUID(),
      lat: point.lat,
      lng: point.lng,
    }

    establishments.value = [...establishments.value, establishment]
    adminMapStore.addStaticLocalPin({
      id: establishment.id,
      lat: establishment.lat,
      lng: establishment.lng,
      title: establishment.name,
      role: 'space_owner',
    })
    closeModal()
    return true
  }

  onScopeDispose(() => {
    bindMapClick(false)
  })

  return {
    establishments,
    isPlacing,
    isModalOpen,
    pendingPoint,
    startPlacement,
    cancelPlacement,
    closeModal,
    submitPin,
  }
}
