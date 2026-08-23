<script setup lang="ts">
import { PencilRuler, ScanSearch, Trash2, Undo2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { MIN_AREA_POINTS } from '@/views/(user)/map/constants'

const props = defineProps<{
  isDrawing: boolean
  hasArea: boolean
  canAnalyze: boolean
  pointCount: number
}>()

const emit = defineEmits<{
  'toggle-draw': []
  undo: []
  clear: []
  analyze: []
}>()
</script>

<template>
  <!-- Drawing HUD -->
  <div class="absolute left-3 top-24 z-900 w-60 rounded-md border bg-card/95 px-3 py-2 shadow">
    <TypographySmall as="p" class="text-xs font-medium">
      {{ props.isDrawing ? 'Drawing Area' : 'Area Selected' }}
    </TypographySmall>
    <TypographyMuted as="p" class="text-xs">
      {{
        props.canAnalyze
          ? `${props.pointCount} boundary points`
          : `Click the map to add points (${props.pointCount}/${MIN_AREA_POINTS})`
      }}
    </TypographyMuted>

    <div class="mt-2 flex gap-1">
      <Button
        size="sm"
        variant="outline"
        class="flex-1"
        :disabled="props.pointCount === 0"
        @click="emit('undo')"
      >
        <Undo2 class="h-3.5 w-3.5" />
        <TypographySmall as="span">Undo</TypographySmall>
      </Button>
      <Button
        size="sm"
        variant="outline"
        class="flex-1"
        :disabled="props.pointCount === 0"
        @click="emit('clear')"
      >
        <Trash2 class="h-3.5 w-3.5" />
        <TypographySmall as="span">Clear</TypographySmall>
      </Button>
    </div>

    <Button
      size="sm"
      class="mt-2 w-full"
      :disabled="!props.canAnalyze"
      @click="emit('analyze')"
    >
      <ScanSearch class="h-3.5 w-3.5" />
      <TypographySmall as="span">Analyze Area</TypographySmall>
    </Button>

    <Button size="sm" variant="ghost" class="mt-1 w-full" @click="emit('toggle-draw')">
      <PencilRuler class="h-3.5 w-3.5" />
      <TypographySmall as="span">
        {{ props.isDrawing ? 'Pause drawing' : 'Keep adding points' }}
      </TypographySmall>
    </Button>
  </div>
</template>
