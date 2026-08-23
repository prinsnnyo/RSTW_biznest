<script setup lang="ts">
import { ChevronRight, Store, Target, Truck, Warehouse } from 'lucide-vue-next'
import type { Component } from 'vue'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { ANALYSIS_OPTIONS } from '@/views/(user)/map/constants'
import type { AnalysisOptionKey } from '@/types/smart-analysis.types'

const emit = defineEmits<{
  select: [key: AnalysisOptionKey]
}>()

const optionIcons: Record<AnalysisOptionKey, Component> = {
  'business-suitability': Target,
  'top-businesses': Store,
  'nearest-suppliers': Truck,
  'nearest-spaces': Warehouse,
}
</script>

<template>
  <div class="grid gap-2">
    <button
      v-for="option in ANALYSIS_OPTIONS"
      :key="option.key"
      type="button"
      class="border-border bg-card hover:bg-muted focus-visible:ring-ring flex items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      @click="emit('select', option.key)"
    >
      <span class="bg-primary/10 text-primary mt-0.5 rounded-md p-2">
        <component :is="optionIcons[option.key]" class="h-4 w-4" />
      </span>
      <span class="min-w-0 flex-1">
        <TypographySmall as="span" class="block font-semibold">{{ option.title }}</TypographySmall>
        <TypographyMuted as="span" class="mt-0.5 block text-xs">
          {{ option.description }}
        </TypographyMuted>
      </span>
      <ChevronRight class="text-muted-foreground mt-2 h-4 w-4 shrink-0" />
    </button>
  </div>
</template>
