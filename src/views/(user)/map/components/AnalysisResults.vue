<script setup lang="ts">
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { AnalysisResult } from '@/views/(user)/map/types/smart-analysis.types'

const props = defineProps<{
  result: AnalysisResult
}>()

function scoreTone(score: number): string {
  if (score >= 75) {
    return 'bg-success'
  }
  return score >= 50 ? 'bg-primary' : 'bg-destructive'
}
</script>

<template>
  <div class="grid gap-4">
    <div>
      <TypographySmall as="p" class="font-semibold">{{ props.result.summary }}</TypographySmall>
      <div v-if="props.result.score !== undefined" class="mt-3 flex items-center gap-3">
        <span class="text-primary text-3xl font-extrabold tabular-nums">
          {{ props.result.score }}
        </span>
        <TypographyMuted as="span" class="text-xs">
          overall suitability score out of 100
        </TypographyMuted>
      </div>
    </div>

    <template v-if="props.result.scoreRows.length > 0">
      <Separator />
      <ul class="grid gap-3">
        <li v-for="row in props.result.scoreRows" :key="row.label" class="grid gap-1">
          <div class="flex items-baseline justify-between gap-2">
            <TypographySmall as="span" class="font-semibold">{{ row.label }}</TypographySmall>
            <TypographySmall as="span" class="tabular-nums">{{ row.score }}</TypographySmall>
          </div>
          <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              class="h-full rounded-full transition-all"
              :class="scoreTone(row.score)"
              :style="{ width: `${row.score}%` }"
            />
          </div>
          <TypographyMuted as="span" class="text-xs">{{ row.detail }}</TypographyMuted>
        </li>
      </ul>
    </template>

    <template v-if="props.result.placeRows.length > 0">
      <Separator />
      <ul class="grid gap-2">
        <li
          v-for="row in props.result.placeRows"
          :key="row.label"
          class="border-border flex items-start justify-between gap-3 rounded-md border p-3"
        >
          <span class="min-w-0">
            <TypographySmall as="span" class="block font-semibold">{{ row.label }}</TypographySmall>
            <TypographyMuted as="span" class="mt-0.5 block text-xs">{{ row.detail }}</TypographyMuted>
          </span>
          <Badge variant="secondary" class="shrink-0 tabular-nums">{{ row.distanceKm }} km</Badge>
        </li>
      </ul>
    </template>

    <Separator />
    <ul class="grid gap-1">
      <li v-for="note in props.result.notes" :key="note">
        <TypographyMuted as="span" class="text-xs">{{ note }}</TypographyMuted>
      </li>
    </ul>
  </div>
</template>
