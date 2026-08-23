<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { cn } from '@/lib/utils'
import type { ChoiceOption } from '@/views/(user)/map/types/smart-analysis.types'

// Radio-style card picker used by every smart-analysis form, so the four forms
// stay visually identical without repeating the markup.
const props = withDefaults(
  defineProps<{
    label: string
    options: ChoiceOption[]
    modelValue: string
    columns?: 1 | 2
  }>(),
  {
    columns: 2,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <fieldset class="grid gap-2">
    <Label as="legend" class="text-sm font-semibold">{{ props.label }}</Label>
    <div
      class="grid gap-2"
      :class="props.columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'"
    >
      <button
        v-for="option in props.options"
        :key="option.value"
        type="button"
        :aria-pressed="props.modelValue === option.value"
        :class="
          cn(
            'flex items-start gap-2 rounded-md border p-3 text-left transition-colors',
            'hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            props.modelValue === option.value
              ? 'border-primary bg-primary/8 ring-1 ring-primary/40'
              : 'border-border bg-card',
          )
        "
        @click="emit('update:modelValue', option.value)"
      >
        <span class="min-w-0 flex-1">
          <TypographySmall as="span" class="block font-semibold">
            {{ option.label }}
          </TypographySmall>
          <TypographyMuted as="span" class="mt-0.5 block text-xs">
            {{ option.description }}
          </TypographyMuted>
        </span>
        <Check
          v-if="props.modelValue === option.value"
          class="text-primary mt-0.5 h-4 w-4 shrink-0"
        />
      </button>
    </div>
  </fieldset>
</template>
