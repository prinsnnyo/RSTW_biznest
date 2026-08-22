<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { listHazardCategories } from '@/services/hazard/hazard.service'
import { useAdminMapStore } from '@/stores/admin.map.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type {
  HazardCategory,
  HazardGeometry,
  HazardGeometryType,
  HazardSeverity,
  HazardStatus,
} from '@/types/hazard.types'

const severityOptions: HazardSeverity[] = ['low', 'moderate', 'high', 'critical']
const statusOptions: HazardStatus[] = [
  'reported',
  'under_review',
  'active',
  'mitigated',
  'resolved',
]
const geometryOptions: HazardGeometryType[] = ['point', 'linestring', 'polygon']
const placementLabels: Record<string, string> = {
  point: 'Pin',
  linestring: 'Draw Line',
  polygon: 'Draw Polygon',
}

const adminMapStore = useAdminMapStore()

const isEditing = computed(() => adminMapStore.editingHazard !== null)
const open = computed(() => adminMapStore.showHazardFormModal || isEditing.value)
const modalTitle = computed(() => (isEditing.value ? 'Update Hazard' : 'Add Hazard'))
const submitLabel = computed(() => (isEditing.value ? 'Update Hazard' : 'Create Hazard'))

const form = reactive({
  name: '',
  category_id: '',
  severity: 'low' as HazardSeverity,
  status: 'reported' as HazardStatus,
  location_name: '',
  description: '',
  geometry_type: 'point' as HazardGeometryType,
  coordinatesText: '',
})

const parseError = ref('')

const fetchedCategories = ref<HazardCategory[]>([])
const isLoadingCategories = ref(false)
const categoryFetchError = ref('')

const resolvedCategories = computed(() =>
  adminMapStore.hazardCategories.length > 0
    ? adminMapStore.hazardCategories
    : fetchedCategories.value,
)

const canSubmit = computed(
  () => form.name.trim().length > 0 && form.category_id.length > 0 && !adminMapStore.isSavingHazard,
)

watch(
  open,
  async (isOpen) => {
    if (!isOpen) {
      categoryFetchError.value = ''
      return
    }

    if (resolvedCategories.value.length > 0) {
      return
    }

    isLoadingCategories.value = true
    categoryFetchError.value = ''
    try {
      fetchedCategories.value = await listHazardCategories()
    } catch (err) {
      categoryFetchError.value = err instanceof Error ? err.message : 'Failed to load categories.'
    } finally {
      isLoadingCategories.value = false
    }
  },
  { immediate: true },
)

watch(
  () => adminMapStore.editingHazard,
  (hazard) => {
    parseError.value = ''

    if (hazard) {
      form.name = hazard.name
      form.category_id = hazard.category_id
      form.severity = hazard.severity
      form.status = hazard.status
      form.location_name = hazard.location_name ?? ''
      form.description = hazard.description ?? ''
      form.geometry_type = hazard.geometry_type
      form.coordinatesText = JSON.stringify(hazard.geometry.coordinates)
      return
    }

    form.name = ''
    form.category_id = ''
    form.severity = 'low'
    form.status = 'reported'
    form.location_name = ''
    form.description = ''
    form.geometry_type = 'point'
    form.coordinatesText = ''
  },
  { immediate: true },
)

function isCoordinatePair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
  )
}

function isLinearRing(value: unknown): value is [number, number][] {
  return Array.isArray(value) && value.length >= 4 && value.every(isCoordinatePair)
}

function buildGeometry(): HazardGeometry | null {
  parseError.value = ''

  try {
    const raw = JSON.parse(form.coordinatesText)

    if (form.geometry_type === 'point') {
      if (!isCoordinatePair(raw)) {
        parseError.value = 'Point coordinates must be [lng, lat].'
        return null
      }

      return { type: 'Point', coordinates: raw }
    }

    if (form.geometry_type === 'linestring') {
      if (!Array.isArray(raw) || raw.length < 2 || !raw.every(isCoordinatePair)) {
        parseError.value = 'LineString coordinates must be [[lng, lat], ...].'
        return null
      }

      return { type: 'LineString', coordinates: raw }
    }

    if (!Array.isArray(raw) || raw.length === 0 || !raw.every(isLinearRing)) {
      parseError.value = 'Polygon coordinates must be [[[lng, lat], ...]].'
      return null
    }

    return { type: 'Polygon', coordinates: raw }
  } catch {
    parseError.value = 'Coordinates must be valid JSON.'
    return null
  }
}

function close(): void {
  if (isEditing.value) {
    adminMapStore.closeEditHazardModal()
    return
  }
  adminMapStore.cancelHazardPlacement()
}

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  const basePayload = {
    name: form.name.trim(),
    category_id: form.category_id,
    severity: form.severity,
    status: form.status,
    location_name: form.location_name.trim() || null,
    description: form.description.trim() || null,
  }

  if (isEditing.value) {
    const hazard = adminMapStore.editingHazard
    if (!hazard) {
      return
    }

    const geometry = buildGeometry()
    if (!geometry) {
      return
    }

    void adminMapStore.handleUpdateHazard({
      hazardId: hazard.id,
      input: { ...basePayload, geometry, geometry_type: form.geometry_type },
    })
    return
  }

  void adminMapStore.handleSaveHazard(basePayload)
}
</script>

<template>
  <Sheet
    :open="open"
    @update:open="
      (val) => {
        if (!val) close()
      }
    "
  >
    <SheetContent
      side="right"
      class="flex flex-col gap-0 p-0 sm:max-w-[41.6667vw] w-full overflow-hidden"
    >
      <SheetHeader class="shrink-0 border-b py-4 px-5 pr-12">
        <SheetTitle class="text-base">{{ modalTitle }}</SheetTitle>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-5">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div class="col-span-2 space-y-1">
            <label class="text-xs font-medium">Hazard Name</label>
            <Input v-model="form.name" placeholder="e.g. River Flooding" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium">Category</label>
            <Select v-model="form.category_id" :disabled="isLoadingCategories">
              <SelectTrigger>
                <SelectValue :placeholder="isLoadingCategories ? 'Loading…' : 'Select category'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in resolvedCategories" :key="cat.id" :value="cat.id">
                  {{ cat.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="categoryFetchError" class="text-xs text-destructive">
              {{ categoryFetchError }}
            </p>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium">Location Name</label>
            <Input v-model="form.location_name" placeholder="Barangay Doongan" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium">Severity</label>
            <Select v-model="form.severity">
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="severity in severityOptions" :key="severity" :value="severity">
                  {{ severity }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium">Status</label>
            <Select v-model="form.status">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="status in statusOptions" :key="status" :value="status">
                  {{ status }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="!isEditing" class="col-span-2 rounded-md border bg-muted/30 p-3">
            <div class="space-y-1">
              <label class="text-xs font-medium">Placement Type</label>
              <p class="text-sm font-medium">
                {{
                  adminMapStore.hazardPlacementType
                    ? placementLabels[adminMapStore.hazardPlacementType]
                    : 'No placement selected'
                }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{
                  adminMapStore.hazardPlacementType === 'point'
                    ? 'Click the map once to place the hazard pin.'
                    : adminMapStore.hazardPlacementType === 'linestring'
                      ? 'Draw the hazard line on the map, then finish to continue.'
                      : 'Draw the hazard polygon on the map, then finish to continue.'
                }}
              </p>
              <p class="text-xs text-muted-foreground">
                Captured points:
                <span class="font-medium">{{ adminMapStore.hazardDrawPoints.length }}</span>
              </p>
            </div>
          </div>

          <div v-else class="space-y-1">
            <label class="text-xs font-medium">Geometry Type</label>
            <Select v-model="form.geometry_type">
              <SelectTrigger>
                <SelectValue placeholder="Select geometry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="geometry in geometryOptions" :key="geometry" :value="geometry">
                  {{ placementLabels[geometry] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="col-span-2 space-y-1">
            <label class="text-xs font-medium">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              placeholder="Describe hazard details"
            />
          </div>

          <div v-if="isEditing" class="col-span-2 space-y-1">
            <label class="text-xs font-medium">Coordinates (JSON)</label>
            <textarea
              v-model="form.coordinatesText"
              rows="4"
              class="border-input focus-visible:border-ring focus-visible:ring-ring/50 font-mono w-full rounded-md border bg-transparent px-3 py-2 text-xs outline-none focus-visible:ring-[3px]"
              :placeholder="
                form.geometry_type === 'point'
                  ? '[125.5406, 8.9475]'
                  : form.geometry_type === 'linestring'
                    ? '[[125.54, 8.94], [125.55, 8.95]]'
                    : '[[[125.54, 8.94], [125.55, 8.94], [125.55, 8.95], [125.54, 8.94]]]'
              "
            />
            <p v-if="parseError" class="text-xs text-destructive">
              {{ parseError }}
            </p>
          </div>
        </div>
      </div>

      <SheetFooter class="shrink-0 border-t bg-background/95 px-5 py-4">
        <Button variant="outline" @click="close">Cancel</Button>
        <Button :disabled="!canSubmit" @click="submit">{{ submitLabel }}</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
