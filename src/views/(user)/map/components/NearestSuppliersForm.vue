<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChoiceCardGroup from '@/views/(user)/map/components/ChoiceCardGroup.vue'
import { BUSINESS_CATEGORIES } from '@/views/(user)/map/constants'
import type { NearestSuppliersInput } from '@/views/(user)/map/types/smart-analysis.types'

const emit = defineEmits<{
  submit: [input: NearestSuppliersInput]
  'update:valid': [valid: boolean]
}>()

const category = ref('')

const canSubmit = computed(() => category.value !== '')

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  emit('submit', { category: category.value })
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
  </form>
</template>
