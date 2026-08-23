<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChoiceCardGroup from '@/views/(user)/map/components/ChoiceCardGroup.vue'
import { SPACE_INTENTS, SPACE_SIZES } from '@/views/(user)/map/constants'
import type { NearestSpacesInput } from '@/types/smart-analysis.types'

const emit = defineEmits<{
  submit: [input: NearestSpacesInput]
  'update:valid': [valid: boolean]
}>()

const intent = ref('')
const spaceSize = ref('')

const canSubmit = computed(() => intent.value !== '' && spaceSize.value !== '')

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  emit('submit', { intent: intent.value, spaceSize: spaceSize.value })
}

// The drawer owns the submit button, so it needs to know when the form is complete.
watch(canSubmit, (valid) => emit('update:valid', valid), { immediate: true })
</script>

<template>
  <form id="smart-analysis-form" class="grid gap-6" @submit.prevent="submit">
    <ChoiceCardGroup v-model="intent" label="Intent" :options="SPACE_INTENTS" />
    <ChoiceCardGroup
      v-model="spaceSize"
      label="Space Size"
      :options="SPACE_SIZES"
      :columns="1"
    />
  </form>
</template>
