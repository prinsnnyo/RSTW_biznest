<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChoiceCardGroup from '@/views/(user)/map/components/ChoiceCardGroup.vue'
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TYPES_BY_CATEGORY,
} from '@/views/(user)/map/constants'
import type { NearestSuppliersInput } from '@/types/smart-analysis.types'

const emit = defineEmits<{
  submit: [input: NearestSuppliersInput]
  'update:valid': [valid: boolean]
}>()

const category = ref('')
const businessType = ref('')

const businessTypes = computed(() => BUSINESS_TYPES_BY_CATEGORY[category.value] ?? [])

// A type only means something inside its category, so switching category drops
// whatever was picked underneath it.
watch(category, () => {
  businessType.value = ''
})

const canSubmit = computed(() => category.value !== '' && businessType.value !== '')

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  emit('submit', { category: category.value, businessType: businessType.value })
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
  </form>
</template>
