<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyP, TypographySmall } from '@/components/typography'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAdminMapStore } from '@/stores/admin.map.store'
import LayerMappedZonesDropdown from '@/views/(admin)/map/components/panels/LayerMappedZonesDropdown.vue'
import ZoningLayerDeleteDialog from '@/views/(admin)/map/components/modals/ZoningLayerDeleteDialog.vue'
import ZoningLayerFormModal from '@/views/(admin)/map/components/panels/ZoningLayerFormModal.vue'
import type { UpdateZoningLayerInput, ZoningLayer } from '@/types/zoning.types'

const adminMapStore = useAdminMapStore()

const expandedLayerIds = ref<Set<string>>(new Set())
const showAddLayerModal = ref(false)
const showEditLayerModal = ref(false)
const editingLayerId = ref<string | null>(null)
const deletingLayerId = ref<string | null>(null)
const deletingMappedZoneId = ref<string | null>(null)

const DEFAULT_LAYER_FORM_VALUE: UpdateZoningLayerInput = {
  title: '',
  color: '#65a30d',
  description: '',
}

const addLayerInitialValue = computed<UpdateZoningLayerInput>(() => DEFAULT_LAYER_FORM_VALUE)

const editLayerInitialValue = computed<UpdateZoningLayerInput>(() => {
  const activeLayer = adminMapStore.zoningLayers.find((layer) => layer.id === editingLayerId.value)

  if (!activeLayer) {
    return DEFAULT_LAYER_FORM_VALUE
  }

  return {
    title: activeLayer.title,
    color: activeLayer.color,
    description: activeLayer.description ?? '',
  }
})

const mappedZoneCountByLayerId = computed<Record<string, number>>(() => {
  return adminMapStore.mappedZones.reduce<Record<string, number>>((acc, zone) => {
    const current = acc[zone.zoning_layer_id] ?? 0
    acc[zone.zoning_layer_id] = current + 1
    return acc
  }, {})
})

const canStartDrawZone = computed(
  () => adminMapStore.zoningLayers.length > 0 && !adminMapStore.isSidebarSubmitting,
)

function toggleLayerExpanded(layerId: string): void {
  const next = new Set(expandedLayerIds.value)

  if (next.has(layerId)) {
    next.delete(layerId)
  } else {
    next.add(layerId)
  }

  expandedLayerIds.value = next
}

function isLayerExpanded(layerId: string): boolean {
  return expandedLayerIds.value.has(layerId)
}

function handleStartDrawZone(): void {
  if (!canStartDrawZone.value) {
    return
  }

  adminMapStore.startDrawZoneMode()
}

function openAddLayerModal(): void {
  showAddLayerModal.value = true
}

function closeAddLayerModal(): void {
  showAddLayerModal.value = false
}

function openEditLayerModal(layer: ZoningLayer): void {
  editingLayerId.value = layer.id
  showEditLayerModal.value = true
}

function closeEditLayerModal(): void {
  showEditLayerModal.value = false
  editingLayerId.value = null
}

function submitLayer(input: UpdateZoningLayerInput): void {
  void adminMapStore.handleCreateLayer(input)
  closeAddLayerModal()
}

function submitLayerUpdate(input: UpdateZoningLayerInput): void {
  const layerId = editingLayerId.value
  if (!layerId) {
    return
  }

  void adminMapStore.handleUpdateLayer({ layerId, input })
  closeEditLayerModal()
}

function openDeleteDialog(layerId: string): void {
  deletingLayerId.value = layerId
}

function cancelDeleteDialog(): void {
  deletingLayerId.value = null
}

function confirmDeleteLayer(): void {
  if (!deletingLayerId.value) {
    return
  }

  void adminMapStore.handleDeleteLayer(deletingLayerId.value)
  cancelDeleteDialog()
}

function toggleLayerVisibility(layer: ZoningLayer): void {
  void adminMapStore.handleToggleLayerVisibility({
    layerId: layer.id,
    isActive: !layer.is_active,
  })
}

function openEditMappedZoneModal(zoneId: string): void {
  const zone = adminMapStore.mappedZones.find((mappedZone) => mappedZone.id === zoneId)
  if (zone) {
    adminMapStore.openEditMappedZoneModal(zone)
  }
}

function openDeleteMappedZoneDialog(zoneId: string): void {
  deletingMappedZoneId.value = zoneId
}

function cancelDeleteMappedZoneDialog(): void {
  deletingMappedZoneId.value = null
}

function confirmDeleteMappedZone(): void {
  if (!deletingMappedZoneId.value) {
    return
  }

  void adminMapStore.handleDeleteMappedZone(deletingMappedZoneId.value)
  cancelDeleteMappedZoneDialog()
}

function close(): void {
  adminMapStore.activePanel = null
}
</script>

<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l">
    <Card class="flex h-full flex-col rounded-none border-0 shadow-none py-0">
      <CardHeader class="shrink-0 border-b py-4">
        <CardTitle class="flex items-center justify-between text-base">
          <div class="flex min-w-0 flex-1 items-center gap-2 text-left">
            <TypographyP as="span" class="m-0 leading-none">Zone Layer</TypographyP>
          </div>

          <div class="ml-3 flex items-center gap-1">
            <Badge variant="secondary">{{ adminMapStore.zoningLayers.length }}</Badge>

            <TooltipProvider :delay-duration="200">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Add zoning layer"
                    :disabled="adminMapStore.isSidebarSubmitting"
                    @click="openAddLayerModal"
                  >
                    <Plus class="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Add a new zoning layer</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="icon-sm" @click="close">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent class="flex-1 space-y-4 overflow-y-auto p-4">
        <div class="flex justify-end">
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <span
                  role="button"
                  tabindex="0"
                  class="group inline-flex items-center gap-1.5 text-sm font-bold transition-colors"
                  :class="
                    canStartDrawZone
                      ? 'cursor-pointer text-muted-foreground hover:text-foreground'
                      : 'cursor-not-allowed text-muted-foreground/60'
                  "
                  :aria-disabled="!canStartDrawZone"
                  @click="handleStartDrawZone"
                  @keydown.enter.prevent="handleStartDrawZone"
                  @keydown.space.prevent="handleStartDrawZone"
                >
                  <span
                    class="text-lg font-bold leading-none transition-transform group-hover:-translate-y-px"
                    >+</span
                  >
                  <span class="transition-colors group-hover:underline">Add Mapped Zone</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">
                Add a new mapped zone by drawing on the map.<br />
                <span class="font-semibold"
                  >Make sure to add a zone layer first before adding a mapped zone.</span
                >
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <section class="space-y-2">
          <div class="space-y-2">
            <div v-for="layer in adminMapStore.zoningLayers" :key="layer.id" class="rounded-md">
              <div class="w-full">
                <div class="w-full h-px bg-border/80" />
                <div
                  class="flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <button
                    type="button"
                    class="flex min-w-0 flex-1 items-center gap-1 text-left"
                    :aria-expanded="isLayerExpanded(layer.id)"
                    :aria-controls="`mapped-zones-${layer.id}`"
                    @click="toggleLayerExpanded(layer.id)"
                  >
                    <span
                      class="h-3 w-3 rounded-sm border"
                      :style="{ backgroundColor: layer.color }"
                    />
                    <TypographySmall as="span" class="flex-1 truncate text-sm font-medium">{{
                      layer.title
                    }}</TypographySmall>
                    <Badge variant="secondary">{{ mappedZoneCountByLayerId[layer.id] ?? 0 }}</Badge>
                    <ChevronRight
                      class="h-3.5 w-3.5 transition-transform"
                      :class="isLayerExpanded(layer.id) ? 'rotate-90' : ''"
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Update layer"
                    :disabled="adminMapStore.isSidebarSubmitting"
                    @click="openEditLayerModal(layer)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Delete layer"
                    :disabled="adminMapStore.isSidebarSubmitting"
                    @click="openDeleteDialog(layer.id)"
                  >
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    :title="layer.is_active ? 'Hide layer zones' : 'Show layer zones'"
                    :disabled="adminMapStore.isSidebarSubmitting"
                    @click="toggleLayerVisibility(layer)"
                  >
                    <Eye v-if="layer.is_active" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </Button>
                </div>
                <div class="w-full h-px bg-border/80" />
              </div>

              <LayerMappedZonesDropdown
                v-if="isLayerExpanded(layer.id)"
                :id="`mapped-zones-${layer.id}`"
                :layer-id="layer.id"
                :mapped-zones="adminMapStore.mappedZones"
                :is-submitting="adminMapStore.isSidebarSubmitting"
                @update-mapped-zone="openEditMappedZoneModal"
                @delete-mapped-zone="openDeleteMappedZoneDialog"
                @select-mapped-zone="adminMapStore.handleFocusMappedZone"
                @edit-mapped-zone-geometry="adminMapStore.handleStartEditMappedZoneGeometry"
              />
            </div>
            <TypographySmall
              v-if="adminMapStore.zoningLayers.length === 0"
              as="p"
              class="text-xs text-muted-foreground"
            >
              No zoning layers yet. Click Add Zoning Layer.
            </TypographySmall>
          </div>
        </section>
      </CardContent>
    </Card>

    <ZoningLayerFormModal
      :open="showAddLayerModal"
      mode="add"
      :is-submitting="adminMapStore.isSidebarSubmitting"
      :initial-value="addLayerInitialValue"
      @close="closeAddLayerModal"
      @submit="submitLayer"
    />

    <ZoningLayerFormModal
      :open="showEditLayerModal"
      mode="edit"
      :is-submitting="adminMapStore.isSidebarSubmitting"
      :initial-value="editLayerInitialValue"
      @close="closeEditLayerModal"
      @submit="submitLayerUpdate"
    />

    <ZoningLayerDeleteDialog
      :open="Boolean(deletingLayerId)"
      :is-submitting="adminMapStore.isSidebarSubmitting"
      @cancel="cancelDeleteDialog"
      @confirm="confirmDeleteLayer"
    />

    <ZoningLayerDeleteDialog
      :open="Boolean(deletingMappedZoneId)"
      :is-submitting="adminMapStore.isSidebarSubmitting"
      title="Delete Mapped Zone?"
      description="This action cannot be undone. This will permanently delete the selected mapped zone."
      confirm-label="Delete"
      @cancel="cancelDeleteMappedZoneDialog"
      @confirm="confirmDeleteMappedZone"
    />
  </aside>
</template>
