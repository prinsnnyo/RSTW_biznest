<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ChevronRight,
  Eye,
  EyeOff,
  MapPinPlus,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TypographyP, TypographySmall } from '@/components/typography'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAdminMapStore } from '@/stores/admin.map.store'
import LayerMappedZonesDropdown from '@/views/(admin)/map/components/panels/LayerMappedZonesDropdown.vue'
import ZoningLayerDeleteDialog from '@/views/(admin)/map/components/modals/ZoningLayerDeleteDialog.vue'
import ZoningLayerFormModal from '@/views/(admin)/map/components/panels/ZoningLayerFormModal.vue'
import type { UpdateZoningLayerInput, ZoningLayer } from '@/types/zoning.types'

const adminMapStore = useAdminMapStore()

// ── Zoning year filter (this panel is the only place it applies) ───────────
const ALL_YEARS_VALUE = 'all'
const selectedZoningYearValue = computed<string>({
  get: () =>
    adminMapStore.selectedZoningYear === null
      ? ALL_YEARS_VALUE
      : String(adminMapStore.selectedZoningYear),
  set: (value) => {
    adminMapStore.setSelectedZoningYear(value === ALL_YEARS_VALUE ? null : Number(value))
  },
})

// ── Filters (layer / status — horizontal scroll) ────────────────────────────
type LayerStatusFilter = 'active' | 'hidden'

const activeLayerFilters = ref<Set<string>>(new Set())
const activeStatusFilters = ref<Set<LayerStatusFilter>>(new Set())

const availableLayerChips = computed(() =>
  adminMapStore.visibleZoningLayers.map((layer) => ({
    id: layer.id,
    title: layer.title,
    color: layer.color,
  })),
)

const availableStatusChips = computed(() => [
  ...new Set<LayerStatusFilter>(
    adminMapStore.visibleZoningLayers.map((layer) => (layer.is_active ? 'active' : 'hidden')),
  ),
])

const hasActiveFilters = computed(
  () => activeLayerFilters.value.size > 0 || activeStatusFilters.value.size > 0,
)

function toggleSetValue<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  return next
}

function toggleLayerFilter(layerId: string): void {
  activeLayerFilters.value = toggleSetValue(activeLayerFilters.value, layerId)
}

function toggleStatusFilter(status: LayerStatusFilter): void {
  activeStatusFilters.value = toggleSetValue(activeStatusFilters.value, status)
}

function clearFilters(): void {
  activeLayerFilters.value = new Set()
  activeStatusFilters.value = new Set()
}

function matchesFilters(layer: ZoningLayer): boolean {
  if (activeLayerFilters.value.size > 0 && !activeLayerFilters.value.has(layer.id)) {
    return false
  }
  if (activeStatusFilters.value.size > 0) {
    const status: LayerStatusFilter = layer.is_active ? 'active' : 'hidden'
    if (!activeStatusFilters.value.has(status)) {
      return false
    }
  }
  return true
}

const filteredZoningLayers = computed(() =>
  adminMapStore.visibleZoningLayers.filter(matchesFilters),
)

const expandedLayerIds = ref<Set<string>>(new Set())
const showAddLayerModal = ref(false)
const showEditLayerModal = ref(false)
const editingLayerId = ref<string | null>(null)
const deletingLayerId = ref<string | null>(null)
const deletingMappedZoneId = ref<string | null>(null)

function defaultLayerFormValue(): UpdateZoningLayerInput {
  return {
    title: '',
    color: '#65a30d',
    description: '',
    year: adminMapStore.selectedZoningYear ?? new Date().getFullYear(),
  }
}

const addLayerInitialValue = computed<UpdateZoningLayerInput>(() => defaultLayerFormValue())

const editLayerInitialValue = computed<UpdateZoningLayerInput>(() => {
  const activeLayer = adminMapStore.zoningLayers.find((layer) => layer.id === editingLayerId.value)

  if (!activeLayer) {
    return defaultLayerFormValue()
  }

  return {
    title: activeLayer.title,
    color: activeLayer.color,
    description: activeLayer.description ?? '',
    year: activeLayer.year,
  }
})

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

function handleCreateZoneForLayer(layer: ZoningLayer): void {
  if (adminMapStore.isSidebarSubmitting) {
    return
  }

  adminMapStore.startDrawZoneMode(layer.id)
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

        <Select v-model="selectedZoningYearValue">
          <SelectTrigger size="sm" class="w-full">
            <SelectValue placeholder="Zoning year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL_YEARS_VALUE">All Years</SelectItem>
            <SelectItem v-for="year in adminMapStore.zoningYears" :key="year" :value="String(year)">
              {{ year }}
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <!-- Filters (horizontal scroll) -->
      <div
        v-if="availableLayerChips.length || availableStatusChips.length"
        class="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b px-2 py-2"
      >
        <button
          v-for="layer in availableLayerChips"
          :key="`layer-${layer.id}`"
          type="button"
          class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition-colors"
          :class="
            activeLayerFilters.has(layer.id)
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:bg-muted/60'
          "
          @click="toggleLayerFilter(layer.id)"
        >
          <span class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: layer.color }" />
          {{ layer.title }}
        </button>

        <button
          v-for="status in availableStatusChips"
          :key="`status-${status}`"
          type="button"
          class="shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs capitalize transition-colors"
          :class="
            activeStatusFilters.has(status)
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:bg-muted/60'
          "
          @click="toggleStatusFilter(status)"
        >
          {{ status }}
        </button>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="shrink-0 whitespace-nowrap rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/60"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>

      <CardContent class="flex-1 space-y-4 overflow-y-auto p-4">
        <section class="space-y-2">
          <div class="space-y-2">
            <div v-for="layer in filteredZoningLayers" :key="layer.id" class="rounded-md">
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
                    <ChevronRight
                      class="h-3.5 w-3.5 transition-transform"
                      :class="isLayerExpanded(layer.id) ? 'rotate-90' : ''"
                    />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Layer actions"
                        :disabled="adminMapStore.isSidebarSubmitting"
                      >
                        <MoreVertical class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="z-10002">
                      <DropdownMenuItem @click="handleCreateZoneForLayer(layer)">
                        <MapPinPlus class="h-4 w-4" />
                        Create Zone
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="openEditLayerModal(layer)">
                        <Pencil class="h-4 w-4" />
                        Edit Layer
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="toggleLayerVisibility(layer)">
                        <Eye v-if="!layer.is_active" class="h-4 w-4" />
                        <EyeOff v-else class="h-4 w-4" />
                        {{ layer.is_active ? 'Hide Zones' : 'Show Zones' }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="text-destructive focus:text-destructive"
                        @click="openDeleteDialog(layer.id)"
                      >
                        <Trash2 class="h-4 w-4" />
                        Delete Layer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              v-if="filteredZoningLayers.length === 0"
              as="p"
              class="text-xs text-muted-foreground"
            >
              {{
                hasActiveFilters
                  ? 'No zoning layers match the selected filters.'
                  : 'No zoning layers for this year yet. Click Add Zoning Layer.'
              }}
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
