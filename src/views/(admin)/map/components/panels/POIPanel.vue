<script setup lang="ts">
import { MapPin, MapPinOff, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyMuted, TypographyP, TypographySmall } from '@/components/typography'
import { useAdminMapStore } from '@/stores/admin.map.store'

const adminMapStore = useAdminMapStore()

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

      <CardContent class="flex-1 p-4">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
          @click="adminMapStore.toggleMapPoi"
        >
          <div>
            <TypographySmall as="span" class="block font-medium">
              Show points of interest
            </TypographySmall>
            <TypographyMuted as="p" class="mt-0.5 text-xs">
              Toggles the basemap's built-in place labels (shops, landmarks, transit).
            </TypographyMuted>
          </div>
          <MapPin v-if="adminMapStore.showMapPoi" class="h-5 w-5 shrink-0 text-primary" />
          <MapPinOff v-else class="h-5 w-5 shrink-0 text-muted-foreground" />
        </button>
      </CardContent>
    </Card>
  </aside>
</template>
