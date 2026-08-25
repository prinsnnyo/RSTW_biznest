<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  RefreshCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyMuted, TypographyP, TypographySmall } from '@/components/typography'
import { useAdminMapStore } from '@/stores/admin.map.store'
import ZoningLayerDeleteDialog from '@/views/(admin)/map/components/modals/ZoningLayerDeleteDialog.vue'
import type { Hazard, HazardCategory, HazardId } from '@/types/hazard.types'

interface HazardGroup {
  categoryId: string
  label: string
  color: string
  hazards: Hazard[]
}

const adminMapStore = useAdminMapStore()

const deletingHazardId = ref<HazardId | null>(null)
const expandedCategoryIds = ref<Set<string>>(new Set())

const groupedHazards = computed((): HazardGroup[] => {
  const categoryMap = new Map<string, HazardCategory>(
    adminMapStore.hazardCategories.map((cat) => [cat.id, cat]),
  )

  const groupMap = new Map<string, HazardGroup>()

  for (const hazard of adminMapStore.hazards) {
    const cat = categoryMap.get(hazard.category_id)
    if (!groupMap.has(hazard.category_id)) {
      groupMap.set(hazard.category_id, {
        categoryId: hazard.category_id,
        label: cat?.label ?? 'Unknown',
        color: cat?.color ?? '#6B7280',
        hazards: [],
      })
    }
    groupMap.get(hazard.category_id)!.hazards.push(hazard)
  }

  const sortOrderMap = new Map<string, number>(
    adminMapStore.hazardCategories.map((cat) => [cat.id, cat.sort_order]),
  )

  return [...groupMap.values()].sort((a, b) => {
    return (sortOrderMap.get(a.categoryId) ?? 999) - (sortOrderMap.get(b.categoryId) ?? 999)
  })
})

const hiddenSet = computed(() => new Set(adminMapStore.hiddenCategoryIds))

function isCategoryHidden(categoryId: string): boolean {
  return hiddenSet.value.has(categoryId)
}

function isExpanded(categoryId: string): boolean {
  return expandedCategoryIds.value.has(categoryId)
}

function toggleExpand(categoryId: string): void {
  const next = new Set(expandedCategoryIds.value)
  if (next.has(categoryId)) {
    next.delete(categoryId)
  } else {
    next.add(categoryId)
  }
  expandedCategoryIds.value = next
}

function openEditModal(hazardId: HazardId): void {
  const hazard = adminMapStore.hazards.find((h) => h.id === hazardId)
  if (hazard) {
    adminMapStore.openEditHazardModal(hazard)
  }
}

function requestDelete(hazardId: HazardId): void {
  deletingHazardId.value = hazardId
}

function cancelDelete(): void {
  deletingHazardId.value = null
}

function confirmDelete(): void {
  if (!deletingHazardId.value) {
    return
  }
  void adminMapStore.handleDeleteHazard(deletingHazardId.value)
  deletingHazardId.value = null
}

function close(): void {
  adminMapStore.activePanel = null
}
</script>

<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l">
    <Card class="flex h-full flex-col rounded-none border-0 shadow-none py-0">
      <!-- Header -->
      <CardHeader class="shrink-0 border-b py-4">
        <CardTitle class="flex items-center justify-between text-base">
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 text-amber-500" />
            <TypographyP as="span" class="m-0 leading-none">Hazards</TypographyP>
          </div>

          <div class="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              :disabled="adminMapStore.isLoadingHazards || adminMapStore.isSavingHazard"
              @click="adminMapStore.loadHazards(true)"
            >
              <RefreshCcw class="h-4 w-4" />
            </Button>

            <Button
              size="icon-sm"
              title="Upload hazard"
              :disabled="adminMapStore.isLoadingHazards || adminMapStore.isSavingHazard"
              @click="adminMapStore.openHazardUploadModal()"
            >
              <Upload class="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon-sm" @click="close">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <!-- Content -->
      <CardContent class="flex-1 overflow-y-auto p-0">
        <!-- Status messages -->
        <div v-if="adminMapStore.isLoadingHazards || adminMapStore.hazardError" class="px-4 pt-3">
          <TypographyMuted v-if="adminMapStore.isLoadingHazards" as="p" class="text-xs">
            Loading hazards…
          </TypographyMuted>
          <TypographySmall v-if="adminMapStore.hazardError" as="p" class="text-xs text-destructive">
            {{ adminMapStore.hazardError }}
          </TypographySmall>
        </div>

        <!-- Empty state -->
        <div v-if="groupedHazards.length === 0 && !adminMapStore.isLoadingHazards" class="px-4 pt-4">
          <div class="rounded-md border p-3">
            <TypographySmall as="p" class="text-xs text-muted-foreground">
              No hazards found.
            </TypographySmall>
          </div>
        </div>

        <!-- Category groups -->
        <div v-else class="py-2">
          <div v-for="group in groupedHazards" :key="group.categoryId">
            <!-- Category row -->
            <div class="flex items-center gap-1 px-2 py-1 hover:bg-muted/40">
              <!-- Expand toggle + label -->
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left"
                @click="toggleExpand(group.categoryId)"
              >
                <span
                  class="h-3 w-3 shrink-0 rounded-full border"
                  :style="{ backgroundColor: group.color }"
                />
                <TypographySmall
                  as="span"
                  class="flex-1 truncate text-sm font-medium"
                  :class="
                    isCategoryHidden(group.categoryId) ? 'text-muted-foreground line-through' : ''
                  "
                >
                  {{ group.label }}
                </TypographySmall>
                <ChevronRight
                  class="h-3.5 w-3.5 shrink-0 transition-transform"
                  :class="isExpanded(group.categoryId) ? 'rotate-90' : ''"
                />
              </button>

              <!-- Visibility toggle -->
              <Button
                variant="ghost"
                size="icon-sm"
                :title="
                  isCategoryHidden(group.categoryId)
                    ? `Show ${group.label} hazards`
                    : `Hide ${group.label} hazards`
                "
                @click="adminMapStore.handleToggleCategoryVisibility(group.categoryId)"
              >
                <Eye v-if="!isCategoryHidden(group.categoryId)" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <!-- Hazard list (expanded) -->
            <div v-if="isExpanded(group.categoryId)" class="pb-1">
              <div
                v-for="hazard in group.hazards"
                :key="hazard.id"
                class="mx-2 mb-1 rounded-md border px-3 py-2 transition-colors"
                :class="
                  adminMapStore.selectedHazardId === hazard.id ? 'border-primary bg-muted/70' : ''
                "
              >
                <button
                  type="button"
                  class="w-full text-left"
                  @click="adminMapStore.handleSelectHazard(hazard.id)"
                >
                  <div class="flex items-center gap-2">
                    <TypographySmall as="span" class="flex-1 truncate text-sm font-medium">
                      {{ hazard.name }}
                    </TypographySmall>
                    <Badge variant="outline" class="shrink-0 text-[10px] uppercase">
                      {{ hazard.severity }}
                    </Badge>
                  </div>
                  <TypographyMuted as="p" class="mt-0.5 text-xs text-muted-foreground">
                    {{ hazard.status }}
                  </TypographyMuted>
                  <TypographyMuted
                    v-if="hazard.location_name"
                    as="p"
                    class="mt-0.5 truncate text-xs text-muted-foreground"
                  >
                    {{ hazard.location_name }}
                  </TypographyMuted>
                </button>

                <div class="mt-1.5 flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    :disabled="adminMapStore.isSavingHazard"
                    title="Edit hazard"
                    @click="openEditModal(hazard.id)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    :disabled="adminMapStore.isSavingHazard"
                    title="Delete hazard"
                    @click="requestDelete(hazard.id)"
                  >
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <ZoningLayerDeleteDialog
      :open="Boolean(deletingHazardId)"
      :is-submitting="adminMapStore.isSavingHazard"
      title="Delete Hazard?"
      description="This action cannot be undone. This will permanently delete the selected hazard."
      confirm-label="Delete"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    />
  </aside>
</template>
