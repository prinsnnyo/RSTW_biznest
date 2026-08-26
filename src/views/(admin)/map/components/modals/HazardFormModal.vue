<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { listHazardCategories } from '@/services/hazard/hazard.service'
import { useAdminMapStore } from '@/stores/admin.map.store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { HazardCategory, HazardSeverity, HazardStatus } from '@/types/hazard.types'

const severityOptions: HazardSeverity[] = ['low', 'moderate', 'high', 'critical']
const statusOptions: HazardStatus[] = [
  'reported',
  'under_review',
  'active',
  'mitigated',
  'resolved',
]
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
  hazard_date: '',
})

// hazard_date is free text — either an actual observed date or a prediction
// like "25 years from now". This toggle just swaps the input between a
// native date picker and a plain text field; both write the same form field.
const isHazardPrediction = ref(false)
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// A plain watch(isHazardPrediction) would also fire — and clear hazard_date
// — when editingHazard sets both values together while loading an existing
// hazard. Only the user flipping the checkbox should clear the field.
function setHazardPrediction(value: boolean): void {
  isHazardPrediction.value = value
  form.hazard_date = ''
}

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
    if (hazard) {
      form.name = hazard.name
      form.category_id = hazard.category_id
      form.severity = hazard.severity
      form.status = hazard.status
      form.location_name = hazard.location_name ?? ''
      form.description = hazard.description ?? ''
      form.hazard_date = hazard.hazard_date ?? ''
      isHazardPrediction.value = Boolean(
        hazard.hazard_date && !ISO_DATE_PATTERN.test(hazard.hazard_date),
      )
      return
    }

    form.name = ''
    form.category_id = ''
    form.severity = 'low'
    form.status = 'reported'
    form.location_name = ''
    form.description = ''
    form.hazard_date = ''
    isHazardPrediction.value = false
  },
  { immediate: true },
)

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
    hazard_date: form.hazard_date || null,
  }

  if (isEditing.value) {
    const hazard = adminMapStore.editingHazard
    if (!hazard) {
      return
    }

    // Geometry isn't editable here — leaving it out of the payload keeps
    // the hazard's existing geometry untouched (a partial DB update).
    void adminMapStore.handleUpdateHazard({
      hazardId: hazard.id,
      input: basePayload,
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

          <div class="space-y-1">
            <label class="text-xs font-medium">{{ isHazardPrediction ? 'Predicted Date' : 'Hazard Date' }}</label>
            <Input
              v-if="isHazardPrediction"
              v-model="form.hazard_date"
              placeholder="e.g. 25 years from now"
            />
            <Input v-else type="date" v-model="form.hazard_date" />
            <label class="flex items-center gap-2 pt-0.5">
              <Checkbox
                :model-value="isHazardPrediction"
                @update:model-value="(value) => setHazardPrediction(!!value)"
              />
              <span class="text-xs text-muted-foreground">This is a prediction, not an observed date</span>
            </label>
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

          <div v-if="isEditing" class="col-span-2 rounded-md border bg-muted/30 p-3">
            <p class="text-xs text-muted-foreground">
              Geometry isn't editable here — delete and re-upload the hazard to change its shape.
            </p>
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
        </div>
      </div>

      <SheetFooter class="shrink-0 border-t bg-background/95 px-5 py-4">
        <Button variant="outline" @click="close">Cancel</Button>
        <Button :disabled="!canSubmit" @click="submit">{{ submitLabel }}</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
