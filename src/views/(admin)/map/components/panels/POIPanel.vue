<script setup lang="ts">
import { Eye, EyeOff, MapPin, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyMuted, TypographyP, TypographySmall } from '@/components/typography'
import { useAdminMapStore } from '@/stores/admin.map.store'

const adminMapStore = useAdminMapStore()

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
          Toggle which built-in place labels show on the basemap.
        </TypographyMuted>

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
      </CardContent>
    </Card>
  </aside>
</template>
