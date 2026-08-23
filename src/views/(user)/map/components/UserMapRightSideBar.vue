<script setup lang="ts">
import { ScanSearch } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Mirrors the admin map's right-hand icon strip, with the single tool a normal
// user gets. Panels dock to the left of the strip, same as the admin one.
defineProps<{
  active: boolean
}>()

const emit = defineEmits<{
  'toggle-smart-analysis': []
}>()
</script>

<template>
  <div class="absolute inset-y-0 right-0 z-1001 flex w-11 shrink-0 flex-col border-l bg-card">
    <TooltipProvider :delay-duration="300">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            aria-label="Smart Analysis"
            :aria-pressed="active"
            class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
            :class="active ? 'bg-muted text-primary' : 'text-muted-foreground'"
            @click="emit('toggle-smart-analysis')"
          >
            <ScanSearch class="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">Smart Analysis</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
