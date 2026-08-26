import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { createActor } from 'xstate'
import { useSelector } from '@xstate/vue'
import { useBarangayBorders } from '@/composables/map/useBarangayBorders.ts'
import { mapDrawMachine, type MapDrawMode } from '@/machines/mapDraw.machine.ts'
import {
  createHazard,
  deleteHazard,
  listHazardCategories,
  listHazards,
  updateHazard,
} from '@/services/hazard/hazard.service.ts'
import { useAuthStore } from '@/stores/auth.store.ts'
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
  UploadHazardFormInput,
} from '@/types/hazard.types.ts'
import type {
  BarangayFeatureCollection,
  MapCanvasApi,
  MapLayerCategory,
  MapLayerInfo,
  MapLightAnchor,
  MapLightSettings,
  MapProjectionType,
  MapSettings,
  MapSkySettings,
  MapSpacePreset,
  MapSpaceSettings,
} from '@/types/map.types.ts'
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
import { toMapPinMarker } from '@/utils/map/pinPopup.utils.ts'

export type AdminMapPanelKey =
  | 'zoning'
  | 'hazard'
  | 'local-business'
  | 'reports'
  | 'poi'
  | 'map-settings'

const FOCUS_STORAGE_KEY = 'biznest:admin-map:focus'

interface StoredFocus {
  lat: number
  lng: number
}

function loadStoredFocus(): StoredFocus | null {
  try {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredFocus>
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') {
      return null
    }

    return { lat: parsed.lat, lng: parsed.lng }
  } catch {
    return null
  }
}

function saveStoredFocus(center: StoredFocus): void {
  try {
    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(center))
  } catch {
    // Storage unavailable (private mode, quota) — persistence is best-effort.
  }
}

const HIDDEN_POI_TYPES_STORAGE_KEY = 'biznest:admin-map:hidden-poi-types'

function loadStoredHiddenPoiTypes(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_POI_TYPES_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : []
  } catch {
    return []
  }
}

function saveStoredHiddenPoiTypes(types: string[]): void {
  try {
    localStorage.setItem(HIDDEN_POI_TYPES_STORAGE_KEY, JSON.stringify(types))
  } catch {
    // Storage unavailable (private mode, quota) — persistence is best-effort.
  }
}

const HIDDEN_MAP_LAYERS_STORAGE_KEY = 'biznest:admin-map:hidden-map-layers'

function loadStoredHiddenMapLayerIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_MAP_LAYERS_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : []
  } catch {
    return []
  }
}

function saveStoredHiddenMapLayerIds(ids: string[]): void {
  try {
    localStorage.setItem(HIDDEN_MAP_LAYERS_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage unavailable (private mode, quota) — persistence is best-effort.
  }
}

// MapTiler's own layer-visibility UI lists categories in this order.
const MAP_LAYER_CATEGORY_ORDER: MapLayerCategory[] = [
  'poi',
  'administrative',
  'built-up',
  'roads',
  'transit',
  'water',
  'nature',
  'background',
]

const MAP_SETTINGS_STORAGE_KEY = 'biznest:admin-map:map-settings'

// Mirrors MapLibre's own style-spec defaults for light/sky, so leaving a
// control untouched matches what the basemap already renders.
function defaultMapSettings(): MapSettings {
  return {
    projection: 'mercator',
    terrainEnabled: false,
    space: {
      preset: 'none',
      haloColor: '#88c6fc',
      haloOpacity: 0.35,
      haloScale: 1.15,
    },
    light: {
      anchor: 'viewport',
      color: '#ffffff',
      position: [1.15, 210, 30],
      intensity: 0.5,
    },
    sky: {
      skyColor: '#88c6fc',
      horizonColor: '#ffffff',
      fogColor: '#ffffff',
    },
  }
}

function loadStoredMapSettings(): MapSettings {
  const defaults = defaultMapSettings()
  try {
    const raw = localStorage.getItem(MAP_SETTINGS_STORAGE_KEY)
    if (!raw) {
      return defaults
    }

    const parsed = JSON.parse(raw) as Partial<MapSettings> | null
    if (!parsed || typeof parsed !== 'object') {
      return defaults
    }

    return {
      projection: parsed.projection === 'globe' ? 'globe' : defaults.projection,
      terrainEnabled: typeof parsed.terrainEnabled === 'boolean' ? parsed.terrainEnabled : defaults.terrainEnabled,
      space: { ...defaults.space, ...parsed.space },
      light: { ...defaults.light, ...parsed.light },
      sky: { ...defaults.sky, ...parsed.sky },
    }
  } catch {
    return defaults
  }
}

function saveStoredMapSettings(settings: MapSettings): void {
  try {
    localStorage.setItem(MAP_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable (private mode, quota) — persistence is best-effort.
  }
}

export const useAdminMapStore = defineStore('adminMap', () => {
  // ── 1. State ────────────────────────────────────────────────────────────────

  // Map
  const mapRef = ref<MapCanvasApi | null>(null)
  // A persisted focus (from a prior visit) takes priority over the resolved
  // city default — restored here, before anything else runs.
  const storedFocus = loadStoredFocus()
  const mapCenter = ref<StoredFocus>(storedFocus ?? { lat: 8.9475, lng: 125.5406 })

  // Barangay borders
  const { barangayBorders, isLoading, errorMessage, loadBarangayBorders } = useBarangayBorders()
  const showBarangayBorders = ref(false)

  // Sidebar UI
  const activePanel = ref<AdminMapPanelKey | null>(null)

  // Map display — built-in basemap POI labels, one entry per style category
  const poiTypes = ref<string[]>([])
  const hiddenPoiTypes = ref<string[]>(loadStoredHiddenPoiTypes())

  // Map display — full MapTiler-style layer catalog (POI/Administrative/
  // Built-up/Roads/Transit/Water/Nature/Background), grouped horizontally by
  // category with each category's individual labels listed vertically.
  const mapLayers = ref<MapLayerInfo[]>([])
  const hiddenMapLayerIds = ref<string[]>(loadStoredHiddenMapLayerIds())
  const activeLayerCategory = ref<MapLayerCategory>('poi')

  // Map Settings — Projection / Space / 3D Terrain / Global Light / Sky.
  const mapSettings = ref<MapSettings>(loadStoredMapSettings())

  // Zoning
  const isSavingLayer = ref(false)
  const isSavingMappedZone = ref(false)
  const zoningError = ref('')
  const zoningLayers = ref<ZoningLayer[]>([])
  const mappedZones = ref<MappedZone[]>([])
  const selectedZoningYear = ref<number | null>(null)

  // Draw mode — point-capture mechanics (manual click vs. freehand drag) are
  // delegated to a shared XState machine; this store only tracks *why* a
  // drawing session is happening (zone vs. hazard, which layer, editing an
  // existing zone's shape) — the machine has no idea what it's drawing for.
  const drawActor = createActor(mapDrawMachine).start()
  const drawVertices = useSelector(drawActor, (snapshot) => snapshot.context.vertices)
  const drawMode = useSelector(drawActor, (snapshot) => snapshot.context.mode)
  const isDrawingActive = useSelector(drawActor, (snapshot) => snapshot.value === 'drawing')
  const showMappedZoneModal = ref(false)
  const selectedMappedZoneId = ref<string | null>(null)
  const editingMappedZoneGeometryId = ref<string | null>(null)
  const editingMappedZone = ref<MappedZone | null>(null)
  const pendingZoneLayerId = ref<string | null>(null)

  // Hazards
  const cityId = ref<string | null>(null)
  const hazardCategories = ref<HazardCategory[]>([])
  const hazards = ref<Hazard[]>([])
  const isLoadingHazards = ref(false)
  const isSavingHazard = ref(false)
  const hazardError = ref('')
  const selectedHazardId = ref<HazardId | null>(null)
  const hiddenCategoryIds = ref<string[]>([])
  const hiddenHazardIds = ref<HazardId[]>([])
  const hasLoadedHazards = ref(false)
  const hazardPlacementType = ref<HazardGeometryType | null>(null)
  const showHazardFormModal = ref(false)
  const editingHazard = ref<Hazard | null>(null)
  const showHazardUploadModal = ref(false)
  const isUploadingHazard = ref(false)
  const hazardUploadError = ref('')

  // Local businesses (pinned locations)
  const localBusinesses = ref<PinnedLocation[]>([])
  const isLoadingLocalBusinesses = ref(false)
  const localBusinessesError = ref('')
  const hasLoadedLocalBusinesses = ref(false)
  const hiddenBusinessRoles = ref<BusinessRole[]>([])
  const selectedLocalBusinessId = ref<string | null>(null)
  // In-memory prototype pins (space-owner pin tool) — not persisted anywhere yet
  const staticLocalPins = ref<MapPinMarker[]>([])

  // Internal-only (not reactive UI state, no need to expose)
  let cityScopedSyncTimer: ReturnType<typeof setInterval> | null = null
  let cityScopedSyncInFlight = false
  let isInitialized = false

  // ── 2. Getters ──────────────────────────────────────────────────────────────

  const isSidebarSubmitting = computed(() => isSavingLayer.value || isSavingMappedZone.value)

  const zoningYears = computed(() => {
    const years = new Set(zoningLayers.value.map((layer) => layer.year))
    return [...years].sort((a, b) => b - a)
  })

  const visibleZoningLayers = computed(() => {
    if (selectedZoningYear.value === null) {
      return zoningLayers.value
    }
    return zoningLayers.value.filter((layer) => layer.year === selectedZoningYear.value)
  })

  const visibleMappedZones = computed(() => {
    const activeLayerIds = new Set(
      visibleZoningLayers.value.filter((layer) => layer.is_active).map((layer) => layer.id),
    )
    return mappedZones.value.filter(
      (zone) => zone.is_visible && activeLayerIds.has(zone.zoning_layer_id),
    )
  })

  const hiddenCategoryIdSet = computed(() => new Set(hiddenCategoryIds.value))
  const hiddenHazardIdSet = computed(() => new Set(hiddenHazardIds.value))

  const visibleHazards = computed(() =>
    hazards.value.filter(
      (h) => !hiddenCategoryIdSet.value.has(h.category_id) && !hiddenHazardIdSet.value.has(h.id),
    ),
  )

  const isHazardPlacementActive = computed(() => hazardPlacementType.value !== null)

  // isDrawMode/drawPoints/hazardDrawPoints/isAnyDrawModeActive/activeDrawPoints
  // keep their pre-machine names and behavior so nothing consuming the store
  // needed to change — they're now derived from the shared machine instead
  // of being independently-mutated refs.
  const isDrawMode = computed(() => isDrawingActive.value && !isHazardPlacementActive.value)
  const isAnyDrawModeActive = isDrawingActive
  const activeDrawPoints = drawVertices
  const drawPoints = computed(() => (isHazardPlacementActive.value ? [] : drawVertices.value))
  const hazardDrawPoints = computed(() =>
    isHazardPlacementActive.value ? drawVertices.value : [],
  )

  const editingMappedZoneGeometry = computed(
    () => mappedZones.value.find((zone) => zone.id === editingMappedZoneGeometryId.value) ?? null,
  )
  const isEditingMappedZoneGeometry = computed(() => editingMappedZoneGeometryId.value !== null)
  const editingMappedZoneGeometryName = computed(() => editingMappedZoneGeometry.value?.name ?? '')

  const hiddenPoiTypeSet = computed(() => new Set(hiddenPoiTypes.value))

  const hiddenMapLayerIdSet = computed(() => new Set(hiddenMapLayerIds.value))

  const mapLayerCategories = computed<MapLayerCategory[]>(() => {
    const present = new Set(mapLayers.value.map((layer) => layer.category))
    return MAP_LAYER_CATEGORY_ORDER.filter((category) => present.has(category))
  })

  const activeMapLayers = computed(() =>
    mapLayers.value.filter((layer) => layer.category === activeLayerCategory.value),
  )

  const hiddenBusinessRoleSet = computed(() => new Set(hiddenBusinessRoles.value))

  const visibleLocalBusinesses = computed(() =>
    localBusinesses.value.filter((pin) => !hiddenBusinessRoleSet.value.has(pin.role)),
  )

  const localBusinessMarkers = computed<MapPinMarker[]>(() => [
    ...visibleLocalBusinesses.value.map(toMapPinMarker),
    ...staticLocalPins.value,
  ])

  // ── 3. Actions ──────────────────────────────────────────────────────────────

  function setMapRef(instance: MapCanvasApi | null): void {
    mapRef.value = instance
  }

  function setMapCenter(center: { lat: number; lng: number }): void {
    mapCenter.value = center
    saveStoredFocus(center)
  }

  function togglePanel(panel: AdminMapPanelKey): void {
    const nextPanel = activePanel.value === panel ? null : panel

    if (activePanel.value === 'local-business' && nextPanel !== 'local-business') {
      clearSelectedLocalBusiness()
    }

    activePanel.value = nextPanel
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

  function setSelectedZoningYear(year: number | null): void {
    selectedZoningYear.value = year
  }

  // Draw machine helpers — every "start a fresh drawing session" action
  // sends RESET then START rather than a bare START, because the machine
  // only handles START from `idle`: if a session is already active (e.g.
  // switching hazard geometry type mid-placement, or starting a new zone
  // while already drawing another), a bare START would be silently ignored.
  function beginDrawSession(initialPoints: MapDrawPoint[] = []): void {
    drawActor.send({ type: 'RESET' })
    drawActor.send({ type: 'START', mode: 'manual', initialPoints })
  }

  function setDrawInteractionMode(mode: MapDrawMode): void {
    drawActor.send({ type: 'SET_MODE', mode })
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

      if (storedFocus) {
        // A persisted focus already won on init — don't snap back to the
        // city default underneath the user.
        return
      }

      const center = await resolveCityCenter({
        cityId: cityId.value,
        cityName: typeof metadata.city_name === 'string' ? metadata.city_name : null,
        legacyCity: typeof metadata.city === 'string' ? metadata.city : null,
      })

      if (!center) {
        return
      }

      setMapCenter({ lat: center.lat, lng: center.lng })
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
  function startDrawZoneMode(layerId?: string): void {
    if (isHazardPlacementActive.value) {
      cancelHazardPlacement()
    }
    if (visibleZoningLayers.value.length === 0) {
      zoningError.value = 'Please add at least one zoning layer before drawing a zone.'
      return
    }
    zoningError.value = ''
    editingMappedZoneGeometryId.value = null
    pendingZoneLayerId.value = layerId ?? null
    beginDrawSession()
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
    beginDrawSession(zone.points.map((point) => ({ lat: point.lat, lng: point.lng })))

    if (zone.points.length > 0) {
      void mapRef.value?.focusOnZone(zone.points)
    }
  }

  function cancelDrawZoneMode(): void {
    drawActor.send({ type: 'RESET' })
    showMappedZoneModal.value = false
    editingMappedZoneGeometryId.value = null
    pendingZoneLayerId.value = null
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

  function handleToggleHazardVisibility(hazardId: HazardId): void {
    if (hiddenHazardIdSet.value.has(hazardId)) {
      hiddenHazardIds.value = hiddenHazardIds.value.filter((id) => id !== hazardId)
    } else {
      hiddenHazardIds.value = [...hiddenHazardIds.value, hazardId]
    }
  }

  function startHazardPlacement(placementType: HazardGeometryType): void {
    if (isDrawMode.value) {
      cancelDrawZoneMode()
    }
    hazardError.value = ''
    hazardPlacementType.value = placementType
    showHazardFormModal.value = false
    beginDrawSession()
  }

  function cancelHazardPlacement(): void {
    hazardPlacementType.value = null
    showHazardFormModal.value = false
    drawActor.send({ type: 'RESET' })
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

  function openHazardUploadModal(): void {
    hazardUploadError.value = ''
    showHazardUploadModal.value = true
  }

  function closeHazardUploadModal(): void {
    showHazardUploadModal.value = false
  }

  async function handleUploadHazard(payload: UploadHazardFormInput): Promise<void> {
    isUploadingHazard.value = true
    hazardUploadError.value = ''
    try {
      const authStore = useAuthStore()

      const createdHazard = await createHazard({
        name: payload.name,
        category_id: payload.category_id,
        severity: payload.severity,
        status: payload.status,
        description: payload.description || null,
        location_name: payload.location_name || null,
        address: payload.address || null,
        barangay: payload.barangay || null,
        city: payload.city || null,
        province: payload.province || null,
        region: payload.region || null,
        hazard_date: payload.hazard_date || null,
        reported_by: authStore.user?.id ?? null,
        city_id: cityId.value ?? '',
        geometry: payload.geometry,
        geometry_type: payload.geometry_type,
        images: payload.images,
        attachments: payload.attachments,
        pmtiles_url: payload.pmtiles_url ?? null,
      })

      hazards.value = [createdHazard, ...hazards.value]
      hasLoadedHazards.value = true
      selectedHazardId.value = createdHazard.id
      closeHazardUploadModal()
    } catch (error) {
      hazardUploadError.value =
        error instanceof Error ? error.message : 'Failed to upload hazard.'
    } finally {
      isUploadingHazard.value = false
    }
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
      mapRef.value?.setCenter({ lat: pin.latitude, lng: pin.longitude }, 16)
    }
  }

  function addStaticLocalPin(pin: MapPinMarker): void {
    staticLocalPins.value.push(pin)
  }

  function clearSelectedLocalBusiness(): void {
    selectedLocalBusinessId.value = null
    mapRef.value?.clearFocusMarker()
  }

  // Map event handlers
  function handleMapClick(point: MapDrawPoint): void {
    if (drawMode.value === 'freehand') {
      // Freehand owns point-capture via its own mousedown/mouseup handlers —
      // a plain click here would double-add a point where a drag started.
      return
    }

    if (isHazardPlacementActive.value) {
      if (hazardPlacementType.value === 'point') {
        if (drawVertices.value.length > 0) {
          drawActor.send({ type: 'MOVE_POINT', index: 0, point })
        } else {
          drawActor.send({ type: 'ADD_POINT', point })
        }
        showHazardFormModal.value = true
        return
      }
      drawActor.send({ type: 'ADD_POINT', point })
      return
    }

    if (!isDrawMode.value) return
    drawActor.send({ type: 'ADD_POINT', point })
  }

  function handleDrawPointMove(index: number, point: MapDrawPoint): void {
    // Point-type hazards never had a draggable vertex — repositioning is
    // done by clicking again, matching the pre-machine behavior.
    if (isHazardPlacementActive.value && hazardPlacementType.value === 'point') return
    if (!isAnyDrawModeActive.value) return
    drawActor.send({ type: 'MOVE_POINT', index, point })
  }

  function undoLastDrawPoint(): void {
    if (!isAnyDrawModeActive.value) return
    drawActor.send({ type: 'UNDO_POINT' })
  }

  const undoLastHazardPoint = undoLastDrawPoint

  function handleDrawUndoShortcut(event: KeyboardEvent): void {
    if (!isAnyDrawModeActive.value || drawVertices.value.length === 0) return
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
    const geometry = hazard.geometry
    if (!geometry) {
      return []
    }
    const toPoint = (point: [number, number]): MapDrawPoint => ({ lat: point[1], lng: point[0] })

    if (geometry.type === 'Point') {
      return [toPoint(geometry.coordinates)]
    }
    if (geometry.type === 'MultiPoint') {
      return geometry.coordinates.map(toPoint)
    }
    if (geometry.type === 'LineString') {
      return geometry.coordinates.map(toPoint)
    }
    if (geometry.type === 'MultiLineString') {
      return geometry.coordinates.flatMap((line) => line.map(toPoint))
    }
    if (geometry.type === 'Polygon') {
      return geometry.coordinates.flatMap((ring) => ring.map(toPoint))
    }
    return geometry.coordinates.flatMap((polygon) =>
      polygon.flatMap((ring) => ring.map(toPoint)),
    )
  }

  function togglePoiTypeVisibility(type: string): void {
    const wasHidden = hiddenPoiTypeSet.value.has(type)
    if (wasHidden) {
      hiddenPoiTypes.value = hiddenPoiTypes.value.filter((t) => t !== type)
    } else {
      hiddenPoiTypes.value = [...hiddenPoiTypes.value, type]
    }
    saveStoredHiddenPoiTypes(hiddenPoiTypes.value)
    mapRef.value?.setPoiTypeVisible(type, wasHidden)
  }

  function isMapLayerHidden(id: string): boolean {
    return hiddenMapLayerIdSet.value.has(id)
  }

  function isMapLayerCategoryHidden(category: MapLayerCategory): boolean {
    const layers = mapLayers.value.filter((layer) => layer.category === category)
    return layers.length > 0 && layers.every((layer) => hiddenMapLayerIdSet.value.has(layer.id))
  }

  function setMapLayerHidden(id: string, hidden: boolean): void {
    const alreadyHidden = hiddenMapLayerIdSet.value.has(id)
    if (hidden === alreadyHidden) {
      return
    }

    hiddenMapLayerIds.value = hidden
      ? [...hiddenMapLayerIds.value, id]
      : hiddenMapLayerIds.value.filter((existing) => existing !== id)
    saveStoredHiddenMapLayerIds(hiddenMapLayerIds.value)
    mapRef.value?.setMapLayerVisible?.(id, !hidden)
  }

  function toggleMapLayerVisibility(id: string): void {
    setMapLayerHidden(id, !isMapLayerHidden(id))
  }

  function toggleMapLayerCategoryVisibility(category: MapLayerCategory): void {
    const hide = !isMapLayerCategoryHidden(category)
    mapLayers.value
      .filter((layer) => layer.category === category)
      .forEach((layer) => setMapLayerHidden(layer.id, hide))
  }

  function setActiveLayerCategory(category: MapLayerCategory): void {
    activeLayerCategory.value = category
  }

  function persistMapSettings(): void {
    saveStoredMapSettings(mapSettings.value)
  }

  function setProjectionType(type: MapProjectionType): void {
    mapSettings.value.projection = type
    persistMapSettings()
    mapRef.value?.setMapProjection?.(type)
  }

  function setTerrainEnabled(enabled: boolean): void {
    mapSettings.value.terrainEnabled = enabled
    persistMapSettings()
    mapRef.value?.setMapTerrain?.(enabled)
  }

  function updateSpaceSettings(patch: Partial<MapSpaceSettings>): void {
    mapSettings.value.space = { ...mapSettings.value.space, ...patch }
    persistMapSettings()
    mapRef.value?.setMapSpace?.(mapSettings.value.space)
  }

  function setSpacePreset(preset: MapSpacePreset): void {
    updateSpaceSettings({ preset })
  }

  function setHaloColor(color: string): void {
    updateSpaceSettings({ haloColor: color })
  }

  function setHaloOpacity(opacity: number): void {
    updateSpaceSettings({ haloOpacity: opacity })
  }

  function setHaloScale(scale: number): void {
    updateSpaceSettings({ haloScale: scale })
  }

  function updateLightSettings(patch: Partial<MapLightSettings>): void {
    mapSettings.value.light = { ...mapSettings.value.light, ...patch }
    persistMapSettings()
    mapRef.value?.setMapLight?.(mapSettings.value.light)
  }

  function setLightAnchor(anchor: MapLightAnchor): void {
    updateLightSettings({ anchor })
  }

  function setLightColor(color: string): void {
    updateLightSettings({ color })
  }

  function setLightIntensity(intensity: number): void {
    updateLightSettings({ intensity })
  }

  function setLightPositionComponent(index: 0 | 1 | 2, value: number): void {
    const position = [...mapSettings.value.light.position] as [number, number, number]
    position[index] = value
    updateLightSettings({ position })
  }

  function updateSkySettings(patch: Partial<MapSkySettings>): void {
    mapSettings.value.sky = { ...mapSettings.value.sky, ...patch }
    persistMapSettings()
    mapRef.value?.setMapSky?.(mapSettings.value.sky)
  }

  function setSkyColor(color: string): void {
    updateSkySettings({ skyColor: color })
  }

  function setHorizonColor(color: string): void {
    updateSkySettings({ horizonColor: color })
  }

  function setFogColor(color: string): void {
    updateSkySettings({ fogColor: color })
  }

  function applyMapSettingsToCanvas(): void {
    mapRef.value?.setMapProjection?.(mapSettings.value.projection)
    mapRef.value?.setMapTerrain?.(mapSettings.value.terrainEnabled)
    mapRef.value?.setMapLight?.(mapSettings.value.light)
    mapRef.value?.setMapSky?.(mapSettings.value.sky)
    mapRef.value?.setMapSpace?.(mapSettings.value.space)
  }

  function handleFreehandPoint(point: MapDrawPoint): void {
    drawActor.send({ type: 'ADD_POINT', point })
  }

  function syncFreehandHandler(): void {
    const active = isDrawingActive.value && drawMode.value === 'freehand'
    mapRef.value?.setFreehandDrawHandler(active ? handleFreehandPoint : null)
  }

  async function onMapReady(): Promise<void> {
    mapRef.value?.setCenter(mapCenter.value)
    poiTypes.value = mapRef.value?.getPoiTypes() ?? []
    hiddenPoiTypes.value.forEach((type) => {
      mapRef.value?.setPoiTypeVisible(type, false)
    })

    mapLayers.value = mapRef.value?.getMapLayers?.() ?? []
    if (
      mapLayers.value.length > 0 &&
      !mapLayers.value.some((layer) => layer.category === activeLayerCategory.value)
    ) {
      activeLayerCategory.value = mapLayers.value[0]!.category
    }
    hiddenMapLayerIds.value.forEach((id) => {
      mapRef.value?.setMapLayerVisible?.(id, false)
    })

    applyMapSettingsToCanvas()
    mapRef.value?.setDrawMode(isAnyDrawModeActive.value)
    mapRef.value?.setMapClickHandler(isAnyDrawModeActive.value ? handleMapClick : null)
    mapRef.value?.setDrawPointMoveHandler(isAnyDrawModeActive.value ? handleDrawPointMove : null)
    syncFreehandHandler()
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

  watch([isDrawingActive, drawMode], syncFreehandHandler)

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
    setMapCenter,
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
    poiTypes,
    hiddenPoiTypes,
    togglePoiTypeVisibility,
    mapLayers,
    mapLayerCategories,
    activeLayerCategory,
    activeMapLayers,
    isMapLayerHidden,
    isMapLayerCategoryHidden,
    toggleMapLayerVisibility,
    toggleMapLayerCategoryVisibility,
    setActiveLayerCategory,
    mapSettings,
    setProjectionType,
    setTerrainEnabled,
    setSpacePreset,
    setHaloColor,
    setHaloOpacity,
    setHaloScale,
    setLightAnchor,
    setLightColor,
    setLightIntensity,
    setLightPositionComponent,
    setSkyColor,
    setHorizonColor,
    setFogColor,
    // Zoning
    isSavingLayer,
    isSavingMappedZone,
    isSidebarSubmitting,
    zoningError,
    zoningLayers,
    mappedZones,
    visibleMappedZones,
    selectedZoningYear,
    zoningYears,
    visibleZoningLayers,
    setSelectedZoningYear,
    handleCreateLayer,
    handleUpdateLayer,
    handleDeleteLayer,
    handleToggleLayerVisibility,
    // Draw zone
    isDrawMode,
    drawMode,
    setDrawInteractionMode,
    drawPoints,
    showMappedZoneModal,
    selectedMappedZoneId,
    pendingZoneLayerId,
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
    hiddenHazardIds,
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
    handleToggleHazardVisibility,
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
    showHazardUploadModal,
    isUploadingHazard,
    hazardUploadError,
    openHazardUploadModal,
    closeHazardUploadModal,
    handleUploadHazard,
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
    addStaticLocalPin,
    // Lifecycle
    initialize,
    dispose,
  }
})
