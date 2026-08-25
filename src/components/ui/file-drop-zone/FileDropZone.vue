<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { File as FileIcon, ImageIcon, Loader2, UploadCloud, X } from 'lucide-vue-next'

type ItemStatus = 'uploading' | 'done' | 'error'

interface DropZoneItem {
  id: string
  file: File
  status: ItemStatus
  result: string | null
  error: string
  previewUrl: string | null
}

const props = withDefaults(
  defineProps<{
    upload: (file: File) => Promise<string>
    multiple?: boolean
    accept?: string
    disabled?: boolean
    hint?: string
  }>(),
  {
    multiple: false,
    accept: '',
    disabled: false,
    hint: '',
  },
)

const emit = defineEmits<{
  (e: 'update:results', results: string[]): void
}>()

const items = ref<DropZoneItem[]>([])
const isDragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const isBusy = computed(() => items.value.some((item) => item.status === 'uploading'))

function emitResults(): void {
  emit(
    'update:results',
    items.value
      .filter((item) => item.status === 'done' && item.result)
      .map((item) => item.result as string),
  )
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function addFiles(fileList: FileList | File[]): Promise<void> {
  if (props.disabled) {
    return
  }

  const files = [...fileList]
  if (files.length === 0) {
    return
  }

  if (!props.multiple) {
    items.value.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
    })
    items.value = []
  }

  const newItems: DropZoneItem[] = files.map((file) => ({
    id: makeId(),
    file,
    status: 'uploading',
    result: null,
    error: '',
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
  }))

  items.value = props.multiple ? [...items.value, ...newItems] : newItems

  await Promise.all(
    newItems.map(async (newItem) => {
      try {
        const result = await props.upload(newItem.file)
        const target = items.value.find((entry) => entry.id === newItem.id)
        if (target) {
          target.status = 'done'
          target.result = result
        }
      } catch (err) {
        const target = items.value.find((entry) => entry.id === newItem.id)
        if (target) {
          target.status = 'error'
          target.error = err instanceof Error ? err.message : 'Upload failed.'
        }
      }
      emitResults()
    }),
  )
}

function onInputChange(event: Event): void {
  const target = event.target as HTMLInputElement
  if (target.files) {
    void addFiles(target.files)
  }
  target.value = ''
}

function openPicker(): void {
  if (!props.disabled) {
    inputRef.value?.click()
  }
}

function onDrop(event: DragEvent): void {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files) {
    void addFiles(event.dataTransfer.files)
  }
}

function onDragOver(event: DragEvent): void {
  event.preventDefault()
  if (!props.disabled) {
    isDragging.value = true
  }
}

function onDragLeave(): void {
  isDragging.value = false
}

function removeItem(id: string): void {
  const item = items.value.find((entry) => entry.id === id)
  if (item?.previewUrl) {
    URL.revokeObjectURL(item.previewUrl)
  }
  items.value = items.value.filter((entry) => entry.id !== id)
  emitResults()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onBeforeUnmount(() => {
  items.value.forEach((item) => {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl)
    }
  })
})

defineExpose({ isBusy })
</script>

<template>
  <div class="space-y-2">
    <div
      class="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 text-center transition-colors"
      :class="[
        isDragging ? 'border-primary bg-primary/5' : 'border-input',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted/40',
      ]"
      @click="openPicker"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <UploadCloud class="h-5 w-5 text-muted-foreground" />
      <p class="text-xs font-medium">Drag & drop {{ multiple ? 'files' : 'a file' }} here, or click to browse</p>
      <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
      <input
        ref="inputRef"
        type="file"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        class="hidden"
        @change="onInputChange"
        @click.stop
      >
    </div>

    <ul v-if="items.length > 0" class="space-y-1">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-2 rounded border px-2 py-1.5 text-xs"
      >
        <img v-if="item.previewUrl" :src="item.previewUrl" class="h-8 w-8 shrink-0 rounded object-cover" alt="">
        <ImageIcon v-else-if="item.file.type.startsWith('image/')" class="h-4 w-4 shrink-0 text-muted-foreground" />
        <FileIcon v-else class="h-4 w-4 shrink-0 text-muted-foreground" />

        <div class="min-w-0 flex-1">
          <p class="truncate font-medium">{{ item.file.name }}</p>
          <p class="text-muted-foreground">
            <span v-if="item.status === 'uploading'">Uploading… </span>
            <span v-else-if="item.status === 'error'" class="text-destructive">{{ item.error }}</span>
            <span v-else>{{ formatSize(item.file.size) }}</span>
          </p>
        </div>

        <Loader2 v-if="item.status === 'uploading'" class="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        <button type="button" class="shrink-0" @click="removeItem(item.id)">
          <X class="h-3.5 w-3.5" />
        </button>
      </li>
    </ul>
  </div>
</template>
