<script setup lang="ts">
import { BookmarkCheck, BookmarkPlus, FileDown, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { TypographySmall } from '@/components/typography'

// Shared footer for every analysis report modal, so Close / Save / Export stay
// identical wherever a report is shown.
defineProps<{
  isSaved: boolean
}>()

const emit = defineEmits<{
  close: []
  save: []
  export: []
}>()
</script>

<template>
  <div class="border-border flex shrink-0 flex-wrap justify-end gap-2 border-t px-6 py-3">
    <Button variant="outline" @click="emit('close')">
      <X class="h-4 w-4" />
      <TypographySmall as="span">Close Report</TypographySmall>
    </Button>
    <Button variant="outline" :disabled="isSaved" @click="emit('save')">
      <component :is="isSaved ? BookmarkCheck : BookmarkPlus" class="h-4 w-4" />
      <TypographySmall as="span">{{ isSaved ? 'Report Saved' : 'Save Report' }}</TypographySmall>
    </Button>
    <Button @click="emit('export')">
      <FileDown class="h-4 w-4" />
      <TypographySmall as="span">Export PDF</TypographySmall>
    </Button>
  </div>
</template>
