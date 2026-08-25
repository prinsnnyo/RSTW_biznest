<script setup lang="ts">
import { computed } from 'vue'
import {
  Building2,
  Droplet,
  Eye,
  EyeOff,
  Landmark,
  Layers,
  MapPin,
  Route,
  TrainFront,
  Trees,
  X,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyMuted, TypographyP, TypographySmall } from '@/components/typography'
import { useAdminMapStore } from '@/stores/admin.map.store'
import type { MapLayerCategory } from '@/types/map.types'

const adminMapStore = useAdminMapStore()

const CATEGORY_META: Record<MapLayerCategory, { label: string; icon: typeof MapPin }> = {
  poi: { label: 'POI', icon: MapPin },
  administrative: { label: 'Administrative', icon: Landmark },
  'built-up': { label: 'Built-up', icon: Building2 },
  roads: { label: 'Roads', icon: Route },
  transit: { label: 'Transit', icon: TrainFront },
  water: { label: 'Water', icon: Droplet },
  nature: { label: 'Nature', icon: Trees },
  background: { label: 'Background', icon: Layers },
}

// Basemap style not yet loaded (or the mounted canvas doesn't expose the
// full layer catalog, e.g. the Google Maps fallback) — degrade to the flat
// POI-only list that adapter still supports everywhere.
const hasCategorizedLayers = computed(() => adminMapStore.mapLayerCategories.length > 0)

function isTypeHidden(type: string): boolean {
  return adminMapStore.hiddenPoiTypes.includes(type)
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
          <div class="flex items-center gap-2">
            <MapPin class="h-4 w-4 text-muted-foreground" />
            <TypographyP as="span" class="m-0 leading-none">Map Labels</TypographyP>
          </div>

          <Button variant="ghost" size="icon-sm" @click="close">
            <X class="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent class="flex-1 overflow-y-auto p-0">
        <TypographyMuted as="p" class="px-4 pt-3 text-xs">
          Toggle which basemap layers and labels show on the map.
        </TypographyMuted>

        <!-- ── Categorized MapTiler-style layer view ─────────────────────── -->
        <template v-if="hasCategorizedLayers">
          <!-- Horizontal category block — click a pill to inspect it below,
               click its eye to hide/show the whole category at once. -->
          <div class="flex flex-wrap gap-1.5 px-4 pt-3">
            <div
              v-for="category in adminMapStore.mapLayerCategories"
              :key="category"
              class="flex items-center gap-1 rounded-full border pl-2.5 pr-1 py-1 transition-colors"
              :class="
                adminMapStore.activeLayerCategory === category
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/40'
              "
            >
              <button
                type="button"
                class="flex items-center gap-1.5"
                @click="adminMapStore.setActiveLayerCategory(category)"
              >
                <component
                  :is="CATEGORY_META[category].icon"
                  class="h-3.5 w-3.5"
                  :class="
                    adminMapStore.isMapLayerCategoryHidden(category)
                      ? 'text-muted-foreground'
                      : 'text-foreground'
                  "
                />
                <TypographySmall
                  as="span"
                  class="text-xs font-medium"
                  :class="adminMapStore.isMapLayerCategoryHidden(category) ? 'text-muted-foreground' : ''"
                >
                  {{ CATEGORY_META[category].label }}
                </TypographySmall>
              </button>

              <Button
                variant="ghost"
                size="icon-sm"
                class="h-5 w-5"
                :title="
                  adminMapStore.isMapLayerCategoryHidden(category)
                    ? `Show ${CATEGORY_META[category].label}`
                    : `Hide ${CATEGORY_META[category].label}`
                "
                @click="adminMapStore.toggleMapLayerCategoryVisibility(category)"
              >
                <Eye v-if="!adminMapStore.isMapLayerCategoryHidden(category)" class="h-3.5 w-3.5" />
                <EyeOff v-else class="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div class="mx-4 mt-3 border-t" />

          <!-- Vertical detail list — every individual label/layer inside the
               selected category. -->
          <div class="py-2">
            <div
              v-for="layer in adminMapStore.activeMapLayers"
              :key="layer.id"
              class="flex items-center gap-1 px-2 py-1 hover:bg-muted/40"
            >
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left"
                @click="adminMapStore.toggleMapLayerVisibility(layer.id)"
              >
                <TypographySmall
                  as="span"
                  class="flex-1 truncate text-sm font-medium"
                  :class="adminMapStore.isMapLayerHidden(layer.id) ? 'text-muted-foreground' : ''"
                >
                  {{ layer.label }}
                </TypographySmall>
              </button>

              <Button
                variant="ghost"
                size="icon-sm"
                :title="
                  adminMapStore.isMapLayerHidden(layer.id) ? `Show ${layer.label}` : `Hide ${layer.label}`
                "
                @click="adminMapStore.toggleMapLayerVisibility(layer.id)"
              >
                <Eye v-if="!adminMapStore.isMapLayerHidden(layer.id)" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div v-if="adminMapStore.activeMapLayers.length === 0" class="px-4 pt-2">
              <TypographySmall as="p" class="text-xs text-muted-foreground">
                No layers in this category.
              </TypographySmall>
            </div>
          </div>
        </template>

        <!-- ── Fallback flat POI list (non-MapLibre canvas) ──────────────── -->
        <template v-else>
          <div v-if="adminMapStore.poiTypes.length === 0" class="px-4 pt-4">
            <div class="rounded-md border p-3">
              <TypographySmall as="p" class="text-xs text-muted-foreground">
                No POI types available for this basemap yet.
              </TypographySmall>
            </div>
          </div>

          <div v-else class="py-2">
            <div
              v-for="type in adminMapStore.poiTypes"
              :key="type"
              class="flex items-center gap-1 px-2 py-1 hover:bg-muted/40"
            >
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left"
                @click="adminMapStore.togglePoiTypeVisibility(type)"
              >
                <TypographySmall
                  as="span"
                  class="flex-1 truncate text-sm font-medium"
                  :class="isTypeHidden(type) ? 'text-muted-foreground' : ''"
                >
                  {{ type }}
                </TypographySmall>
              </button>

              <Button
                variant="ghost"
                size="icon-sm"
                :title="isTypeHidden(type) ? `Show ${type}` : `Hide ${type}`"
                @click="adminMapStore.togglePoiTypeVisibility(type)"
              >
                <Eye v-if="!isTypeHidden(type)" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>
  </aside>
</template>
