<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useAdminMapStore } from '@/stores/admin.map.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const adminMapStore = useAdminMapStore()

const isEditing = computed(() => adminMapStore.editingMappedZone !== null)
const open = computed(() => adminMapStore.showMappedZoneModal || isEditing.value)
const modalTitle = computed(() => (isEditing.value ? 'Update Mapped Zone' : 'Save Mapped Zone'))
const submitLabel = computed(() => (isEditing.value ? 'Update Zone' : 'Save Zone'))

const form = reactive({
  name: '',
  zoningLayerId: '',
  description: '',
})

const canSubmit = computed(
  () =>
    form.name.trim().length > 0 &&
    form.zoningLayerId.trim().length > 0 &&
    !adminMapStore.isSavingMappedZone,
)

watch(
  () => adminMapStore.editingMappedZone,
  (zone) => {
    if (zone) {
      form.name = zone.name
      form.description = zone.description ?? ''
      form.zoningLayerId = zone.zoning_layer_id
      return
    }

    if (!adminMapStore.showMappedZoneModal) {
      return
    }

    form.name = ''
    form.description = ''
    form.zoningLayerId = adminMapStore.zoningLayers[0]?.id ?? ''
  },
  { immediate: true },
)

watch(
  () => adminMapStore.showMappedZoneModal,
  (isOpen) => {
    if (!isOpen || isEditing.value) {
      return
    }

    form.name = ''
    form.description = ''
    form.zoningLayerId = adminMapStore.zoningLayers[0]?.id ?? ''
  },
)

watch(
  () => adminMapStore.zoningLayers,
  (layers) => {
    if (!open.value) {
      return
    }

    const hasSelectedLayer = layers.some((layer) => layer.id === form.zoningLayerId)
    if (!hasSelectedLayer) {
      form.zoningLayerId = layers[0]?.id ?? ''
    }
  },
  { deep: true },
)

function close(): void {
  if (isEditing.value) {
    adminMapStore.closeEditMappedZoneModal()
    return
  }
  adminMapStore.showMappedZoneModal = false
}

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  const payload = {
    name: form.name.trim(),
    zoningLayerId: form.zoningLayerId,
    description: form.description.trim(),
  }

  if (isEditing.value) {
    const zone = adminMapStore.editingMappedZone
    if (!zone) {
      return
    }

    void adminMapStore.handleUpdateMappedZone({ zoneId: zone.id, input: payload })
    return
  }

  void adminMapStore.handleSaveMappedZone(payload)
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4">
    <Card class="w-full max-w-md py-0">
      <CardHeader class="border-b py-4">
        <CardTitle class="text-base">{{ modalTitle }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3 p-4">
        <p v-if="!isEditing" class="text-xs text-muted-foreground">
          {{ adminMapStore.drawPoints.length }} polygon points captured.
        </p>

        <div class="space-y-1">
          <label class="text-xs font-medium">Mapped Zone Name</label>
          <Input v-model="form.name" placeholder="e.g. North Trade Zone" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Zoning Type</label>
          <Select v-model="form.zoningLayerId">
            <SelectTrigger>
              <SelectValue placeholder="Select zoning layer" />
            </SelectTrigger>
            <SelectContent class="z-10002">
              <SelectItem
                v-for="layer in adminMapStore.zoningLayers"
                :key="layer.id"
                :value="layer.id"
              >
                {{ layer.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Description (Optional)</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            placeholder="Describe this mapped zone"
          />
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="close">Cancel</Button>
          <Button :disabled="!canSubmit" @click="submit">{{ submitLabel }}</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
