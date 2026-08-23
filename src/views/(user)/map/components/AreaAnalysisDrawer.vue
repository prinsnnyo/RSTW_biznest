<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { TypographySmall } from '@/components/typography'
import { ANALYSIS_OPTIONS } from '@/views/(user)/map/constants'
import AnalysisOptionList from '@/views/(user)/map/components/AnalysisOptionList.vue'
import BusinessSuitabilityForm from '@/views/(user)/map/components/BusinessSuitabilityForm.vue'
import NearestSpacesForm from '@/views/(user)/map/components/NearestSpacesForm.vue'
import NearestSuppliersForm from '@/views/(user)/map/components/NearestSuppliersForm.vue'
import TopBusinessesForm from '@/views/(user)/map/components/TopBusinessesForm.vue'
import type {
  AnalysisOptionKey,
  BusinessSuitabilityInput,
  NearestSpacesInput,
  NearestSuppliersInput,
  SmartAnalysisStep,
  TopBusinessesInput,
} from '@/types/smart-analysis.types'

// One drawer for the whole flow — options, the chosen form, then results — so
// the map never leaves the screen.
const props = defineProps<{
  step: SmartAnalysisStep
  areaSummary: string
  selectedOption: AnalysisOptionKey | null
}>()

const emit = defineEmits<{
  close: []
  back: []
  select: [key: AnalysisOptionKey]
  'submit-business-suitability': [input: BusinessSuitabilityInput]
  'submit-top-businesses': [input: TopBusinessesInput]
  'submit-nearest-suppliers': [input: NearestSuppliersInput]
  'submit-nearest-spaces': [input: NearestSpacesInput]
}>()

const isFormValid = ref(false)

// Each form mounts fresh, so validity restarts with it.
watch(
  () => props.selectedOption,
  () => {
    isFormValid.value = false
  },
)

function optionTitle(key: AnalysisOptionKey | null): string {
  return ANALYSIS_OPTIONS.find((option) => option.key === key)?.title ?? 'Area Analysis'
}

function handleOpenChange(isOpen: boolean): void {
  if (!isOpen) {
    emit('close')
  }
}
</script>

<template>
  <Sheet
    :open="props.step === 'choosing' || props.step === 'form'"
    @update:open="handleOpenChange"
  >
    <SheetContent side="right" class="w-full gap-0 sm:max-w-lg">
      <SheetHeader class="shrink-0">
        <SheetTitle>
          {{ props.step === 'choosing' ? 'Area Analysis' : optionTitle(props.selectedOption) }}
        </SheetTitle>
        <SheetDescription>{{ props.areaSummary }}</SheetDescription>
      </SheetHeader>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <template v-if="props.step === 'choosing'">
          <TypographySmall as="p" class="mb-3 font-semibold">
            What would you like to do?
          </TypographySmall>
          <AnalysisOptionList @select="emit('select', $event)" />
        </template>

        <template v-else-if="props.step === 'form'">
          <BusinessSuitabilityForm
            v-if="props.selectedOption === 'business-suitability'"
            @submit="emit('submit-business-suitability', $event)"
            @update:valid="isFormValid = $event"
          />
          <TopBusinessesForm
            v-else-if="props.selectedOption === 'top-businesses'"
            @submit="emit('submit-top-businesses', $event)"
            @update:valid="isFormValid = $event"
          />
          <NearestSuppliersForm
            v-else-if="props.selectedOption === 'nearest-suppliers'"
            @submit="emit('submit-nearest-suppliers', $event)"
            @update:valid="isFormValid = $event"
          />
          <NearestSpacesForm
            v-else-if="props.selectedOption === 'nearest-spaces'"
            @submit="emit('submit-nearest-spaces', $event)"
            @update:valid="isFormValid = $event"
          />
        </template>
      </div>

      <SheetFooter v-if="props.step !== 'choosing'" class="shrink-0 flex-row gap-2">
        <Button variant="outline" class="flex-1" @click="emit('back')">
          <ArrowLeft class="h-4 w-4" />
          <TypographySmall as="span">Back to options</TypographySmall>
        </Button>
        <Button type="submit" form="smart-analysis-form" class="flex-1" :disabled="!isFormValid">
          <TypographySmall as="span">Run analysis</TypographySmall>
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
