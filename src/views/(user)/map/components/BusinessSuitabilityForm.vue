<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChoiceCardGroup from '@/views/(user)/map/components/ChoiceCardGroup.vue'
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TYPES_BY_CATEGORY,
  INVESTMENT_SCALES,
  OPERATING_DAYS,
  OPERATING_HOURS,
} from '@/views/(user)/map/constants'
import type { BusinessSuitabilityInput } from '@/views/(user)/map/types/smart-analysis.types'

const emit = defineEmits<{
  submit: [input: BusinessSuitabilityInput]
  'update:valid': [valid: boolean]
}>()

const category = ref('')
const businessType = ref('')
const investmentScale = ref('')
const operatingDays = ref('')
const operatingHours = ref('')

const businessTypes = computed(() => BUSINESS_TYPES_BY_CATEGORY[category.value] ?? [])

// A type only means something inside its category, so switching category drops
// whatever was picked underneath it.
watch(category, () => {
  businessType.value = ''
})

const canSubmit = computed(
  () =>
    category.value !== '' &&
    businessType.value !== '' &&
    investmentScale.value !== '' &&
    operatingDays.value !== '' &&
    operatingHours.value !== '',
)

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  emit('submit', {
    category: category.value,
    businessType: businessType.value,
    investmentScale: investmentScale.value,
    operatingDays: operatingDays.value,
    operatingHours: operatingHours.value,
  })
}

// The drawer owns the submit button, so it needs to know when the form is complete.
watch(canSubmit, (valid) => emit('update:valid', valid), { immediate: true })
</script>

<template>
  <form id="smart-analysis-form" class="grid gap-6" @submit.prevent="submit">
    <ChoiceCardGroup
      v-model="category"
      label="Business Category"
      :options="BUSINESS_CATEGORIES"
    />
    <ChoiceCardGroup
      v-if="businessTypes.length > 0"
      v-model="businessType"
      label="Business Type"
      :options="businessTypes"
    />
    <ChoiceCardGroup
      v-model="investmentScale"
      label="Investment Scale / Enterprise Type"
      :options="INVESTMENT_SCALES"
      :columns="1"
    />
    <ChoiceCardGroup v-model="operatingDays" label="Operating Days" :options="OPERATING_DAYS" />
    <ChoiceCardGroup v-model="operatingHours" label="Operating Hours" :options="OPERATING_HOURS" />
  </form>
</template>
