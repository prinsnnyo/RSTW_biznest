<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChoiceCardGroup from '@/views/(user)/map/components/ChoiceCardGroup.vue'
import {
  INVESTMENT_SCALES,
  OPERATING_DAYS,
  OPERATING_HOURS,
} from '@/views/(user)/map/constants'
import type { TopBusinessesInput } from '@/views/(user)/map/types/smart-analysis.types'

const emit = defineEmits<{
  submit: [input: TopBusinessesInput]
  'update:valid': [valid: boolean]
}>()

const investmentScale = ref('')
const operatingDays = ref('')
const operatingHours = ref('')

const canSubmit = computed(
  () => investmentScale.value !== '' && operatingDays.value !== '' && operatingHours.value !== '',
)

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  emit('submit', {
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
      v-model="investmentScale"
      label="Investment Scale / Enterprise Type"
      :options="INVESTMENT_SCALES"
      :columns="1"
    />
    <ChoiceCardGroup v-model="operatingDays" label="Operating Days" :options="OPERATING_DAYS" />
    <ChoiceCardGroup v-model="operatingHours" label="Operating Hours" :options="OPERATING_HOURS" />
  </form>
</template>
