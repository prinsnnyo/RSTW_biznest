<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<template>
  <div
    v-if="visible"
    class="absolute inset-y-0 right-0 z-1001 flex w-11 shrink-0 flex-col border-l bg-card"
  >
    <!-- Tabs removed for now — restructuring. -->
  </div>
</template>
