<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { UpdateZoningLayerInput } from '@/types/zoning.types'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'add' | 'edit'
    isSubmitting?: boolean
    initialValue?: UpdateZoningLayerInput
  }>(),
  {
    isSubmitting: false,
    initialValue: () => ({
      title: '',
      color: '#65a30d',
      description: '',
    }),
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: UpdateZoningLayerInput): void
}>()

const form = reactive<UpdateZoningLayerInput>({
  title: '',
  color: '#65a30d',
  description: '',
})

const modalTitle = computed(() =>
  props.mode === 'add' ? 'Add Zoning Layer' : 'Update Zoning Layer',
)
const submitLabel = computed(() => (props.mode === 'add' ? 'Save Layer' : 'Update Layer'))
const canSubmit = computed(() => form.title.trim().length > 0 && !props.isSubmitting)

watch(
  () => [props.open, props.initialValue, props.mode],
  () => {
    if (!props.open) {
      return
    }

    form.title = props.initialValue.title
    form.color = props.initialValue.color
    form.description = props.initialValue.description
  },
  { immediate: true, deep: true },
)

function submitForm(): void {
  if (!canSubmit.value) {
    return
  }

  emit('submit', {
    title: form.title.trim(),
    color: form.color,
    description: form.description.trim(),
  })
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4">
    <Card class="w-full max-w-md py-0">
      <CardHeader class="border-b py-4">
        <CardTitle class="text-base">{{ modalTitle }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3 p-4">
        <div class="space-y-1">
          <label class="text-xs font-medium">Zoning Title</label>
          <Input v-model="form.title" placeholder="e.g. Residential" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Color</label>
          <Input v-model="form.color" type="color" class="h-10 w-14 p-1" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Description (Optional)</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            placeholder="Short layer description"
          />
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="emit('close')">Cancel</Button>
          <Button :disabled="!canSubmit" @click="submitForm">{{ submitLabel }}</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
