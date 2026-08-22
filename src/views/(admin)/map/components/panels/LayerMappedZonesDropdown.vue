<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import type { MappedZone } from '@/types/zoning.types'

const props = withDefaults(
  defineProps<{
    layerId: string
    mappedZones?: MappedZone[]
    isSubmitting?: boolean
  }>(),
  {
    mappedZones: () => [],
    isSubmitting: false,
  },
)

const emit = defineEmits<{
  (e: 'update-mapped-zone', zoneId: string): void
  (e: 'edit-mapped-zone-geometry', zoneId: string): void
  (e: 'delete-mapped-zone', zoneId: string): void
  (e: 'select-mapped-zone', zoneId: string): void
}>()

const zones = computed(() => {
  return props.mappedZones.filter((zone) => zone.zoning_layer_id === props.layerId)
})
</script>

<template>
  <div class="mt-1 space-y-0.5">
    <div v-for="zone in zones" :key="zone.id">
      <div class="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted/40">
        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          @click="emit('select-mapped-zone', zone.id)"
        >
          <TypographySmall as="span" class="block truncate text-xs font-medium">{{
            zone.name
          }}</TypographySmall>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Edit mapped zone polygon"
          :disabled="isSubmitting"
          @click="emit('edit-mapped-zone-geometry', zone.id)"
        >
          <span class="text-[10px] font-semibold">Shape</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Update mapped zone"
          :disabled="isSubmitting"
          @click="emit('update-mapped-zone', zone.id)"
        >
          <Pencil class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Delete mapped zone"
          :disabled="isSubmitting"
          @click="emit('delete-mapped-zone', zone.id)"
        >
          <Trash2 class="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      <div class="h-px w-full bg-border/60" />
    </div>

    <TypographyMuted
      v-if="zones.length === 0"
      as="p"
      class="px-2 text-[11px] text-muted-foreground"
    >
      No mapped zones yet.
    </TypographyMuted>
  </div>
</template>
