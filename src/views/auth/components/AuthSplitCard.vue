<script setup lang="ts">
defineSlots<{
  form(): unknown
  visual(): unknown
}>()
</script>

<template>
  <div
    class="border-border/70 bg-card/80 overflow-hidden rounded-[2rem] border shadow-[0_24px_80px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md"
  >
    <div class="grid md:grid-cols-2">
      <div class="p-6 md:p-9">
        <slot name="form" />
      </div>
      <div
        class="relative hidden min-h-80 overflow-hidden bg-linear-to-br from-primary/25 via-secondary/20 to-accent/15 md:block"
      >
        <div class="absolute -top-16 -right-10 size-56 rounded-full bg-accent/25 blur-3xl" />
        <div class="absolute -bottom-20 -left-10 size-64 rounded-full bg-primary/30 blur-3xl" />
        <slot name="visual" />
      </div>
    </div>
  </div>
</template>
