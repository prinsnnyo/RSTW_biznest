<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { cn } from '@/lib/utils'
import type { ChoiceOption } from '@/types/smart-analysis.types'

// Radio-style card picker used by every smart-analysis form, so the forms stay
// visually identical without repeating the markup.
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
    <div class="grid gap-2" :class="props.columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'">
      <button
        v-for="option in props.options"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="props.modelValue === option.value"
        :class="
          cn(
            'flex items-start gap-2.5 rounded-md border p-3 text-left transition-colors',
            'hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            props.modelValue === option.value
              ? 'border-success bg-success/8 ring-success/40 ring-1'
              : 'border-border bg-card',
          )
        "
        @click="emit('update:modelValue', option.value)"
      >
        <!-- Radio dot: fills green once the option is the chosen one. -->
        <span
          :class="
            cn(
              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              props.modelValue === option.value
                ? 'border-success bg-success'
                : 'border-muted-foreground/40 bg-transparent',
            )
          "
        >
          <span
            v-if="props.modelValue === option.value"
            class="bg-success-foreground h-1.5 w-1.5 rounded-full"
          />
        </span>

        <span class="min-w-0 flex-1">
          <TypographySmall as="span" class="block font-semibold">
            {{ option.label }}
          </TypographySmall>
          <TypographyMuted v-if="option.description" as="span" class="mt-0.5 block text-xs">
            {{ option.description }}
          </TypographyMuted>
        </span>
      </button>
    </div>
  </fieldset>
</template>
