import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useBarangayBorders } from '@/composables/map/useBarangayBorders.ts'
import {
  createHazard,
  deleteHazard,
  listHazardCategories,
  listHazards,
  updateHazard,
} from '@/services/hazard/hazard.service.ts'
import {
  createMappedZone,
  createZoningLayer,
  deleteMappedZone,
  deleteZoningLayer,
  listCityMappedZones,
  listCityZoningLayers,
  setZoningLayerActive,
  updateMappedZone,
  updateZoningLayer,
} from '@/services/zoning/zoning.service.ts'
import { resolveCityCenter } from '@/services/cities.service.ts'
import { getSupabaseClient } from '@/services/supabase.client.ts'
import { listAllPinsForAdmin } from '@/services/pinned-locations.service.ts'
import type {
  CreateHazardFormInput,
  Hazard,
  HazardCategory,
  HazardGeometry,
  HazardGeometryType,
  HazardId,
  UpdateHazardInput,
} from '@/types/hazard.types.ts'
import type { BarangayFeatureCollection } from '@/types/map.types.ts'
import type {
  CreateMappedZoneInput,
  CreateZoningLayerInput,
  MappedZone,
  MapDrawPoint,
  UpdateMappedZoneInput,
  UpdateZoningLayerInput,
  ZoningLayer,
} from '@/types/zoning.types.ts'
import type { BusinessRole, MapPinMarker, PinnedLocation } from '@/types/pinned-location.types.ts'
import type Maplibre from '@/views/(admin)/map/components/Maplibre.vue'

export type AdminMapPanelKey = 'zoning' | 'hazard' | 'local-business' | 'reports' | 'poi'

export const useAdminMapStore = defineStore('adminMap', () => {
  // ── 1. State ────────────────────────────────────────────────────────────────

  // Map
  const mapRef = ref<InstanceType<typeof Maplibre> | null>(null)
  const mapCenter = ref({ lat: 8.9475, lng: 125.5406 })

  // Barangay borders
  const { barangayBorders, isLoading, errorMessage, loadBarangayBorders } = useBarangayBorders()
  const showBarangayBorders = ref(false)

  // Sidebar UI
  const activePanel = ref<AdminMapPanelKey | null>(null)

  // Map display
  const showMapPoi = ref(true)

  // Zoning
  const isSavingLayer = ref(false)
  const isSavingMappedZone = ref(false)
  const zoningError = ref('')
  const zoningLayers = ref<ZoningLayer[]>([])
  const mappedZones = ref<MappedZone[]>([])

  // Draw mode
  const isDrawMode = ref(false)
  const drawPoints = ref<MapDrawPoint[]>([])
  const showMappedZoneModal = ref(false)
  const selectedMappedZoneId = ref<string | null>(null)
  const editingMappedZoneGeometryId = ref<string | null>(null)
  const editingMappedZone = ref<MappedZone | null>(null)

  // Hazards
  const cityId = ref<string | null>(null)
  const hazardCategories = ref<HazardCategory[]>([])
  const hazards = ref<Hazard[]>([])
  const isLoadingHazards = ref(false)
  const isSavingHazard = ref(false)
  const hazardError = ref('')
  const selectedHazardId = ref<HazardId | null>(null)
  const hiddenCategoryIds = ref<string[]>([])
  const hasLoadedHazards = ref(false)
  const hazardPlacementType = ref<HazardGeometryType | null>(null)
  const hazardDrawPoints = ref<MapDrawPoint[]>([])
  const showHazardFormModal = ref(false)
  const editingHazard = ref<Hazard | null>(null)

  // Local businesses (pinned locations)
  const localBusinesses = ref<PinnedLocation[]>([])
  const isLoadingLocalBusinesses = ref(false)
  const localBusinessesError = ref('')
  const hasLoadedLocalBusinesses = ref(false)
  const hiddenBusinessRoles = ref<BusinessRole[]>([])
  const selectedLocalBusinessId = ref<string | null>(null)

  // Internal-only (not reactive UI state, no need to expose)
  let cityScopedSyncTimer: ReturnType<typeof setInterval> | null = null
  let cityScopedSyncInFlight = false
  let isInitialized = false

  // ── 2. Getters ──────────────────────────────────────────────────────────────

  const isSidebarSubmitting = computed(() => isSavingLayer.value || isSavingMappedZone.value)

  const visibleMappedZones = computed(() => {
    const activeLayerIds = new Set(
      zoningLayers.value.filter((layer) => layer.is_active).map((layer) => layer.id),
    )
    return mappedZones.value.filter(
      (zone) => zone.is_visible && activeLayerIds.has(zone.zoning_layer_id),
    )
  })

  const hiddenCategoryIdSet = computed(() => new Set(hiddenCategoryIds.value))

  const visibleHazards = computed(() =>
    hazards.value.filter((h) => !hiddenCategoryIdSet.value.has(h.category_id)),
  )

  const isHazardPlacementActive = computed(() => hazardPlacementType.value !== null)
  const activeDrawPoints = computed(() =>
    isHazardPlacementActive.value ? hazardDrawPoints.value : drawPoints.value,
  )
  const isAnyDrawModeActive = computed(() => isDrawMode.value || isHazardPlacementActive.value)
  const editingMappedZoneGeometry = computed(
    () => mappedZones.value.find((zone) => zone.id === editingMappedZoneGeometryId.value) ?? null,
  )
  const isEditingMappedZoneGeometry = computed(() => editingMappedZoneGeometryId.value !== null)
  const editingMappedZoneGeometryName = computed(() => editingMappedZoneGeometry.value?.name ?? '')

  const hiddenBusinessRoleSet = computed(() => new Set(hiddenBusinessRoles.value))

  const visibleLocalBusinesses = computed(() =>
    localBusinesses.value.filter((pin) => !hiddenBusinessRoleSet.value.has(pin.role)),
  )

  const localBusinessMarkers = computed<MapPinMarker[]>(() =>
    visibleLocalBusinesses.value.map((pin) => ({
      id: pin.id,
      lat: pin.latitude,
      lng: pin.longitude,
      title: pin.title,
      role: pin.role,
    })),
  )

  // ── 3. Actions ──────────────────────────────────────────────────────────────

  function setMapRef(instance: InstanceType<typeof Maplibre> | null): void {
    mapRef.value = instance
  }

  function togglePanel(panel: AdminMapPanelKey): void {
    activePanel.value = activePanel.value === panel ? null : panel
  }

  function buildZoningLayersSignature(layers: ZoningLayer[]): string {
    return layers.map((layer) => `${layer.id}|${layer.is_active}|${layer.updated_at}`).join('||')
  }

  function buildMappedZonesSignature(zones: MappedZone[]): string {
    return zones
      .map((zone) => {
        const points = zone.points
          .map((point) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`)
          .join(';')

        return [
          zone.id,
          zone.zoning_layer_id,
          zone.is_visible,
          zone.updated_at,
          zone.zoning_color,
          points,
        ].join('|')
      })
      .join('||')
  }

  // Barangay borders
  async function toggleBarangayBorders(): Promise<void> {
    if (!showBarangayBorders.value) {
      await loadBarangayBorders()
    }
    showBarangayBorders.value = !showBarangayBorders.value
  }

  // Zoning layers
  async function loadZoningLayers(): Promise<void> {
    zoningError.value = ''
    try {
      const nextLayers = await listCityZoningLayers()
      if (
        buildZoningLayersSignature(nextLayers) === buildZoningLayersSignature(zoningLayers.value)
      ) {
        return
      }

      zoningLayers.value = nextLayers
    } catch (error) {
      zoningError.value = error instanceof Error ? error.message : 'Failed to load zoning layers.'
    }
  }

  async function loadMappedZones(): Promise<void> {
    zoningError.value = ''
    try {
      const nextZones = await listCityMappedZones()
      if (buildMappedZonesSignature(nextZones) === buildMappedZonesSignature(mappedZones.value)) {
        return
      }

      mappedZones.value = nextZones
    } catch (error) {
      zoningError.value = error instanceof Error ? error.message : 'Failed to load mapped zones.'
    }
  }

  async function refreshCityScopedMapData(): Promise<void> {
    if (cityScopedSyncInFlight) {
      return
    }

    cityScopedSyncInFlight = true
    try {
      await Promise.all([loadZoningLayers(), loadMappedZones()])
    } finally {
      cityScopedSyncInFlight = false
    }
  }

  function startCityScopedSync(): void {
    if (cityScopedSyncTimer !== null) {
      return
    }

    cityScopedSyncTimer = setInterval(() => {
      void refreshCityScopedMapData()
    }, 6000)
  }

  function stopCityScopedSync(): void {
    if (cityScopedSyncTimer !== null) {
      clearInterval(cityScopedSyncTimer)
      cityScopedSyncTimer = null
    }
  }

  async function loadMapCenterFromUserMetadata(): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        return
      }

      const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>
      cityId.value = typeof metadata.city_id === 'string' ? metadata.city_id : null
      const center = await resolveCityCenter({
        cityId: cityId.value,
        cityName: typeof metadata.city_name === 'string' ? metadata.city_name : null,
        legacyCity: typeof metadata.city === 'string' ? metadata.city : null,
      })

      if (!center) {
        return
      }

      mapCenter.value = { lat: center.lat, lng: center.lng }
      mapRef.value?.setCenter(mapCenter.value)
    } catch {
      // Keep default map center if city-center lookup data is unavailable.
    }
  }

  async function handleCreateLayer(payload: CreateZoningLayerInput): Promise<void> {
    isSavingLayer.value = true
    zoningError.value = ''
    try {
      const createdLayer = await createZoningLayer(payload)
      zoningLayers.value = [createdLayer, ...zoningLayers.value]
    } catch (error) {
      zoningError.value = error instanceof Error ? error.message : 'Failed to save zoning layer.'
    } finally {
      isSavingLayer.value = false
    }
  }

  async function handleUpdateLayer(payload: {
    layerId: string
    input: UpdateZoningLayerInput
  }): Promise<void> {
    isSavingLayer.value = true
    zoningError.value = ''
    try {
      const updatedLayer = await updateZoningLayer(payload.layerId, payload.input)
      zoningLayers.value = zoningLayers.value.map((layer) =>
        layer.id !== updatedLayer.id ? layer : updatedLayer,
      )
    } catch (error) {
      zoningError.value = error instanceof Error ? error.message : 'Failed to update zoning layer.'
    } finally {
      isSavingLayer.value = false
    }
  }

  async function handleDeleteLayer(layerId: string): Promise<void> {
    isSavingLayer.value = true
    zoningError.value = ''
    try {
      await deleteZoningLayer(layerId)
      zoningLayers.value = zoningLayers.value.filter((layer) => layer.id !== layerId)
    } catch (error) {
      zoningError.value = error instanceof Error ? error.message : 'Failed to delete zoning layer.'
    } finally {
      isSavingLayer.value = false
    }
  }

  async function handleToggleLayerVisibility(payload: {
    layerId: string
    isActive: boolean
  }): Promise<void> {
    isSavingLayer.value = true
    zoningError.value = ''
    try {
      const updatedLayer = await setZoningLayerActive(payload.layerId, payload.isActive)
      zoningLayers.value = zoningLayers.value.map((layer) =>
        layer.id !== updatedLayer.id ? layer : updatedLayer,
      )
    } catch (error) {
      zoningError.value =
        error instanceof Error ? error.message : 'Failed to toggle layer visibility.'
    } finally {
      isSavingLayer.value = false
    }
  }

  // Mapped zones
  async function handleSaveMappedZone(
    payload: Omit<CreateMappedZoneInput, 'points'>,
  ): Promise<void> {
    isSavingMappedZone.value = true
    zoningError.value = ''
    try {
      await createMappedZone({ ...payload, points: drawPoints.value })
      await loadMappedZones()
      cancelDrawZoneMode()
    } catch (error) {
      zoningError.value = error instanceof Error ? error.message : 'Failed to save mapped zone.'
    } finally {
      isSavingMappedZone.value = false
    }
  }

  async function handleUpdateMappedZone(payload: {
    zoneId: string
    input: UpdateMappedZoneInput
  }): Promise<void> {
    isSavingMappedZone.value = true
    zoningError.value = ''
    try {
      await updateMappedZone(payload.zoneId, payload.input)
      await loadMappedZones()
      editingMappedZone.value = null
    } catch (error) {
      zoningError.value = error instanceof Error ? error.message : 'Failed to update mapped zone.'
    } finally {
      isSavingMappedZone.value = false
    }
  }

  async function handleDeleteMappedZone(zoneId: string): Promise<void> {
    isSavingMappedZone.value = true
    zoningError.value = ''
    try {
      await deleteMappedZone(zoneId)
      await loadMappedZones()
    } catch (error) {
      zoningError.value = error instanceof Error ? error.message : 'Failed to delete mapped zone.'
    } finally {
      isSavingMappedZone.value = false
    }
  }

  function handleFocusMappedZone(zoneId: string): void {
    selectedMappedZoneId.value = zoneId
  }

  function openEditMappedZoneModal(zone: MappedZone): void {
    editingMappedZone.value = zone
  }

  function closeEditMappedZoneModal(): void {
    editingMappedZone.value = null
  }

  // Draw zone mode
  function startDrawZoneMode(): void {
    if (isHazardPlacementActive.value) {
      cancelHazardPlacement()
    }
    if (zoningLayers.value.length === 0) {
      zoningError.value = 'Please add at least one zoning layer before drawing a zone.'
      return
    }
    zoningError.value = ''
    drawPoints.value = []
    editingMappedZoneGeometryId.value = null
    isDrawMode.value = true
  }

  function handleStartEditMappedZoneGeometry(zoneId: string): void {
    if (isHazardPlacementActive.value) {
      cancelHazardPlacement()
    }

    const zone = mappedZones.value.find((mappedZone) => mappedZone.id === zoneId)
    if (!zone) {
      zoningError.value = 'Unable to find the selected mapped zone.'
      return
    }

    zoningError.value = ''
    selectedMappedZoneId.value = zone.id
    showMappedZoneModal.value = false
    editingMappedZoneGeometryId.value = zone.id
    drawPoints.value = zone.points.map((point) => ({ lat: point.lat, lng: point.lng }))
    isDrawMode.value = true

    if (zone.points.length > 0) {
      void mapRef.value?.focusOnZone(zone.points)
    }
  }

  function cancelDrawZoneMode(): void {
    isDrawMode.value = false
    drawPoints.value = []
    showMappedZoneModal.value = false
    editingMappedZoneGeometryId.value = null
  }

  async function finishDrawZoneMode(): Promise<void> {
    if (drawPoints.value.length < 3) {
      zoningError.value = 'Draw at least 3 points to create a polygon.'
      return
    }

    if (editingMappedZoneGeometryId.value !== null) {
      await handleSaveEditedMappedZoneGeometry()
      return
    }

    showMappedZoneModal.value = true
  }

  async function handleSaveEditedMappedZoneGeometry(): Promise<void> {
    const targetZone = editingMappedZoneGeometry.value

    if (!targetZone) {
      zoningError.value = 'No mapped zone is selected for geometry editing.'
      return
    }

    isSavingMappedZone.value = true
    zoningError.value = ''
    try {
      await updateMappedZone(targetZone.id, {
        zoningLayerId: targetZone.zoning_layer_id,
        name: targetZone.name,
        description: targetZone.description ?? '',
        points: drawPoints.value,
      })
      await loadMappedZones()
      cancelDrawZoneMode()
      selectedMappedZoneId.value = targetZone.id
    } catch (error) {
      zoningError.value =
        error instanceof Error ? error.message : 'Failed to update mapped zone geometry.'
    } finally {
      isSavingMappedZone.value = false
    }
  }

  // Hazard placement
  async function loadHazardCategories(): Promise<void> {
    try {
      hazardCategories.value = await listHazardCategories()
    } catch {
      // Non-critical: form falls back to empty category list
    }
  }

  async function loadHazards(force = false): Promise<void> {
    if (hasLoadedHazards.value && !force) {
      return
    }
    isLoadingHazards.value = true
    hazardError.value = ''
    try {
      const response = await listHazards({
        page: 1,
        pageSize: 100,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
      hazards.value = response.data
      hasLoadedHazards.value = true
    } catch (error) {
      hazardError.value = error instanceof Error ? error.message : 'Failed to load hazards.'
    } finally {
      isLoadingHazards.value = false
    }
  }

  function handleToggleCategoryVisibility(categoryId: string): void {
    if (hiddenCategoryIdSet.value.has(categoryId)) {
      hiddenCategoryIds.value = hiddenCategoryIds.value.filter((id) => id !== categoryId)
    } else {
      hiddenCategoryIds.value = [...hiddenCategoryIds.value, categoryId]
    }
  }

  function startHazardPlacement(placementType: HazardGeometryType): void {
    if (isDrawMode.value) {
      cancelDrawZoneMode()
    }
    hazardError.value = ''
    hazardPlacementType.value = placementType
    hazardDrawPoints.value = []
    showHazardFormModal.value = false
  }

  function cancelHazardPlacement(): void {
    hazardPlacementType.value = null
    hazardDrawPoints.value = []
    showHazardFormModal.value = false
  }

  function appendHazardPoint(point: MapDrawPoint): void {
    if (!hazardPlacementType.value) return
    if (hazardPlacementType.value === 'point') {
      hazardDrawPoints.value = [point]
      showHazardFormModal.value = true
      return
    }
    hazardDrawPoints.value = [...hazardDrawPoints.value, point]
  }

  function moveHazardPoint(index: number, point: MapDrawPoint): void {
    if (!hazardPlacementType.value || hazardPlacementType.value === 'point') return
    hazardDrawPoints.value = hazardDrawPoints.value.map((existing, i) =>
      i !== index ? existing : point,
    )
  }

  function undoLastHazardPoint(): void {
    if (!hazardPlacementType.value || hazardDrawPoints.value.length === 0) return
    if (hazardPlacementType.value === 'point') {
      hazardDrawPoints.value = []
      return
    }
    hazardDrawPoints.value = hazardDrawPoints.value.slice(0, -1)
  }

  function finishHazardPlacement(): void {
    if (!hazardPlacementType.value) return
    if (hazardPlacementType.value === 'linestring' && hazardDrawPoints.value.length < 2) {
      hazardError.value = 'Draw at least 2 points to create a hazard line.'
      return
    }
    if (hazardPlacementType.value === 'polygon' && hazardDrawPoints.value.length < 3) {
      hazardError.value = 'Draw at least 3 points to create a hazard polygon.'
      return
    }
    showHazardFormModal.value = true
  }

  function buildHazardGeometry(): HazardGeometry | null {
    if (!hazardPlacementType.value || hazardDrawPoints.value.length === 0) return null

    const toCoordinates = (point: MapDrawPoint): [number, number] => [point.lng, point.lat]
    const firstDrawPoint = hazardDrawPoints.value[0]
    if (!firstDrawPoint) return null

    if (hazardPlacementType.value === 'point') {
      return { type: 'Point', coordinates: toCoordinates(firstDrawPoint) }
    }

    if (hazardPlacementType.value === 'linestring') {
      return { type: 'LineString', coordinates: hazardDrawPoints.value.map(toCoordinates) }
    }

    const ring = hazardDrawPoints.value.map(toCoordinates)
    const [firstPoint] = ring
    const lastPoint = ring[ring.length - 1]
    if (
      firstPoint &&
      lastPoint &&
      (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1])
    ) {
      ring.push(firstPoint)
    }
    return { type: 'Polygon', coordinates: [ring] }
  }

  async function handleSaveHazard(payload: CreateHazardFormInput): Promise<void> {
    if (!hazardPlacementType.value) {
      hazardError.value = 'Choose a hazard placement type first.'
      return
    }
    const geometry = buildHazardGeometry()
    if (!geometry) {
      hazardError.value = 'Capture a valid geometry on the map first.'
      return
    }
    isSavingHazard.value = true
    hazardError.value = ''
    try {
      const createdHazard = await createHazard({
        ...payload,
        city_id: cityId.value ?? '',
        geometry,
        geometry_type: hazardPlacementType.value,
      })
      hazards.value = [createdHazard, ...hazards.value]
      hasLoadedHazards.value = true
      selectedHazardId.value = createdHazard.id
      cancelHazardPlacement()
    } catch (error) {
      hazardError.value = error instanceof Error ? error.message : 'Failed to create hazard.'
    } finally {
      isSavingHazard.value = false
    }
  }

  function handleStartCreateHazard(placementType: HazardGeometryType): void {
    startHazardPlacement(placementType)
  }

  function handleSelectHazard(hazardId: HazardId): void {
    selectedHazardId.value = hazardId
  }

  function openEditHazardModal(hazard: Hazard): void {
    editingHazard.value = hazard
  }

  function closeEditHazardModal(): void {
    editingHazard.value = null
  }

  async function handleUpdateHazard(payload: {
    hazardId: HazardId
    input: UpdateHazardInput
  }): Promise<void> {
    isSavingHazard.value = true
    hazardError.value = ''
    try {
      const updatedHazard = await updateHazard(payload.hazardId, payload.input)
      hazards.value = hazards.value.map((hazard) =>
        hazard.id !== updatedHazard.id ? hazard : updatedHazard,
      )
      editingHazard.value = null
    } catch (error) {
      hazardError.value = error instanceof Error ? error.message : 'Failed to update hazard.'
    } finally {
      isSavingHazard.value = false
    }
  }

  async function handleDeleteHazard(hazardId: HazardId): Promise<void> {
    isSavingHazard.value = true
    hazardError.value = ''
    try {
      await deleteHazard(hazardId)
      hazards.value = hazards.value.filter((hazard) => hazard.id !== hazardId)
      if (selectedHazardId.value === hazardId) {
        selectedHazardId.value = null
      }
    } catch (error) {
      hazardError.value = error instanceof Error ? error.message : 'Failed to delete hazard.'
    } finally {
      isSavingHazard.value = false
    }
  }

  // Local businesses (pinned locations)
  async function loadLocalBusinesses(force = false): Promise<void> {
    if (hasLoadedLocalBusinesses.value && !force) {
      return
    }
    isLoadingLocalBusinesses.value = true
    localBusinessesError.value = ''
    try {
      localBusinesses.value = await listAllPinsForAdmin()
      hasLoadedLocalBusinesses.value = true
    } catch (error) {
      localBusinessesError.value =
        error instanceof Error ? error.message : 'Failed to load local businesses.'
    } finally {
      isLoadingLocalBusinesses.value = false
    }
  }

  function toggleBusinessRoleVisibility(role: BusinessRole): void {
    if (hiddenBusinessRoleSet.value.has(role)) {
      hiddenBusinessRoles.value = hiddenBusinessRoles.value.filter((r) => r !== role)
    } else {
      hiddenBusinessRoles.value = [...hiddenBusinessRoles.value, role]
    }
  }

  function handleSelectLocalBusiness(pinId: string): void {
    selectedLocalBusinessId.value = pinId
    activePanel.value = 'local-business'

    const pin = localBusinesses.value.find((business) => business.id === pinId)
    if (pin) {
      void mapRef.value?.focusLocation({ lat: pin.latitude, lng: pin.longitude }, pin.title)
    }
  }

  function clearSelectedLocalBusiness(): void {
    selectedLocalBusinessId.value = null
  }

  // Map event handlers
  function handleMapClick(point: MapDrawPoint): void {
    if (isHazardPlacementActive.value) {
      appendHazardPoint(point)
      if (hazardPlacementType.value === 'point') {
        showHazardFormModal.value = true
      }
      return
    }
    if (!isDrawMode.value) return
    drawPoints.value = [...drawPoints.value, point]
  }

  function handleDrawPointMove(index: number, point: MapDrawPoint): void {
    if (isHazardPlacementActive.value) {
      moveHazardPoint(index, point)
      return
    }
    if (!isDrawMode.value) return
    drawPoints.value = drawPoints.value.map((existing, i) => (i !== index ? existing : point))
  }

  function undoLastDrawPoint(): void {
    if (isHazardPlacementActive.value) {
      undoLastHazardPoint()
      return
    }
    if (!isDrawMode.value || drawPoints.value.length === 0) return
    drawPoints.value = drawPoints.value.slice(0, -1)
  }

  function handleDrawUndoShortcut(event: KeyboardEvent): void {
    const activePoints = isHazardPlacementActive.value ? hazardDrawPoints.value : drawPoints.value
    if (!isAnyDrawModeActive.value || activePoints.length === 0) return
    if (event.defaultPrevented || event.shiftKey || event.altKey) return

    const isUndoShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z'
    if (!isUndoShortcut) return

    const target = event.target as HTMLElement | null
    const isTypingTarget =
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    if (isTypingTarget) return

    event.preventDefault()
    undoLastDrawPoint()
  }

  // Map ref helpers
  function getHazardFocusPoints(hazard: Hazard): MapDrawPoint[] {
    if (hazard.geometry.type === 'Point') {
      const [lng, lat] = hazard.geometry.coordinates
      return [{ lat, lng }]
    }
    if (hazard.geometry.type === 'LineString') {
      return hazard.geometry.coordinates.map((point) => ({ lat: point[1], lng: point[0] }))
    }
    return hazard.geometry.coordinates.flatMap((ring) =>
      ring.map((point) => ({ lat: point[1], lng: point[0] })),
    )
  }

  function toggleMapPoi(): void {
    showMapPoi.value = !showMapPoi.value
    mapRef.value?.setPoisVisible(showMapPoi.value)
  }

  async function onMapReady(): Promise<void> {
    mapRef.value?.setCenter(mapCenter.value)
    mapRef.value?.setPoisVisible(showMapPoi.value)
    mapRef.value?.setDrawMode(isAnyDrawModeActive.value)
    mapRef.value?.setMapClickHandler(isAnyDrawModeActive.value ? handleMapClick : null)
    mapRef.value?.setDrawPointMoveHandler(isAnyDrawModeActive.value ? handleDrawPointMove : null)
    await Promise.all([
      mapRef.value?.renderBarangayBorders(
        showBarangayBorders.value,
        (barangayBorders.value as BarangayFeatureCollection) ?? null,
      ),
      mapRef.value?.renderMappedZones(visibleMappedZones.value),
      mapRef.value?.renderHazards(true, visibleHazards.value),
      mapRef.value?.renderDrawPreview(activeDrawPoints.value),
      mapRef.value?.renderPinnedLocations(localBusinessMarkers.value, handleSelectLocalBusiness),
    ])
  }

  // ── Watchers ────────────────────────────────────────────────────────────────
  watch(
    [showBarangayBorders, barangayBorders],
    () => {
      void mapRef.value?.renderBarangayBorders(
        showBarangayBorders.value,
        (barangayBorders.value as BarangayFeatureCollection) ?? null,
      )
    },
    { deep: true },
  )

  watch(
    visibleMappedZones,
    (zones) => {
      void mapRef.value?.renderMappedZones(zones)
    },
    { deep: true },
  )

  watch(
    visibleHazards,
    (visible) => {
      void mapRef.value?.renderHazards(true, visible)
    },
    { deep: true },
  )

  watch(
    localBusinessMarkers,
    (markers) => {
      void mapRef.value?.renderPinnedLocations(markers, handleSelectLocalBusiness)
    },
    { deep: true },
  )

  watch(
    activeDrawPoints,
    (points) => {
      void mapRef.value?.renderDrawPreview(points)
    },
    { deep: true },
  )

  watch(
    [selectedMappedZoneId, visibleMappedZones],
    () => {
      if (!selectedMappedZoneId.value) return
      const zone = visibleMappedZones.value.find((z) => z.id === selectedMappedZoneId.value)
      if (zone?.points.length) {
        void mapRef.value?.focusOnZone(zone.points)
      }
    },
    { deep: true },
  )

  watch(
    [selectedHazardId, hazards],
    () => {
      if (!selectedHazardId.value) return
      const hazard = hazards.value.find((h) => h.id === selectedHazardId.value)
      if (hazard) {
        const points = getHazardFocusPoints(hazard)
        if (points.length) {
          void mapRef.value?.focusOnZone(points)
        }
      }
    },
    { deep: true },
  )

  watch(isAnyDrawModeActive, async (enabled) => {
    mapRef.value?.setDrawMode(enabled)
    mapRef.value?.setMapClickHandler(enabled ? handleMapClick : null)
    mapRef.value?.setDrawPointMoveHandler(enabled ? handleDrawPointMove : null)
    await mapRef.value?.renderMappedZones(visibleMappedZones.value)
    await mapRef.value?.renderDrawPreview(activeDrawPoints.value)
  })

  // ── Lifecycle (driven by the view, not Vue's onMounted/onBeforeUnmount —
  //    this store outlives the component that first creates it) ──────────────
  const handleWindowFocusSync = (): void => {
    void refreshCityScopedMapData()
  }

  async function initialize(): Promise<void> {
    if (isInitialized) {
      return
    }
    isInitialized = true

    window.addEventListener('keydown', handleDrawUndoShortcut)
    window.addEventListener('focus', handleWindowFocusSync)
    startCityScopedSync()
    await Promise.all([
      loadMapCenterFromUserMetadata(),
      loadZoningLayers(),
      loadMappedZones(),
      loadHazardCategories(),
      loadHazards(),
      loadLocalBusinesses(),
    ])
  }

  function dispose(): void {
    if (!isInitialized) {
      return
    }
    isInitialized = false

    window.removeEventListener('keydown', handleDrawUndoShortcut)
    window.removeEventListener('focus', handleWindowFocusSync)
    stopCityScopedSync()
    mapRef.value = null
  }

  return {
    // Map
    mapRef,
    mapCenter,
    setMapRef,
    onMapReady,
    // Barangay borders
    barangayBorders,
    isLoading,
    errorMessage,
    showBarangayBorders,
    toggleBarangayBorders,
    // Sidebar UI
    activePanel,
    togglePanel,
    // Map display
    showMapPoi,
    toggleMapPoi,
    // Zoning
    isSavingLayer,
    isSavingMappedZone,
    isSidebarSubmitting,
    zoningError,
    zoningLayers,
    mappedZones,
    visibleMappedZones,
    handleCreateLayer,
    handleUpdateLayer,
    handleDeleteLayer,
    handleToggleLayerVisibility,
    // Draw zone
    isDrawMode,
    drawPoints,
    showMappedZoneModal,
    selectedMappedZoneId,
    isEditingMappedZoneGeometry,
    editingMappedZoneGeometryName,
    isAnyDrawModeActive,
    activeDrawPoints,
    startDrawZoneMode,
    handleStartEditMappedZoneGeometry,
    cancelDrawZoneMode,
    finishDrawZoneMode,
    handleSaveMappedZone,
    handleUpdateMappedZone,
    handleDeleteMappedZone,
    handleFocusMappedZone,
    editingMappedZone,
    openEditMappedZoneModal,
    closeEditMappedZoneModal,
    // Hazards
    hazardCategories,
    hazards,
    hiddenCategoryIds,
    isLoadingHazards,
    isSavingHazard,
    hazardError,
    selectedHazardId,
    hazardPlacementType,
    hazardDrawPoints,
    showHazardFormModal,
    isHazardPlacementActive,
    loadHazards,
    handleSaveHazard,
    handleToggleCategoryVisibility,
    handleStartCreateHazard,
    handleSelectHazard,
    handleUpdateHazard,
    handleDeleteHazard,
    cancelHazardPlacement,
    undoLastDrawPoint,
    undoLastHazardPoint,
    finishHazardPlacement,
    editingHazard,
    openEditHazardModal,
    closeEditHazardModal,
    // Local businesses
    localBusinesses,
    isLoadingLocalBusinesses,
    localBusinessesError,
    hiddenBusinessRoles,
    selectedLocalBusinessId,
    visibleLocalBusinesses,
    loadLocalBusinesses,
    toggleBusinessRoleVisibility,
    handleSelectLocalBusiness,
    clearSelectedLocalBusiness,
    // Lifecycle
    initialize,
    dispose,
  }
})
