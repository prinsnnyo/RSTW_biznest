<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <div class="relative flex min-h-svh flex-col overflow-hidden">
    <div class="pointer-events-none absolute inset-0 bg-far" />
    <div
      class="pointer-events-none absolute -top-24 left-1/4 size-80 rounded-full bg-primary/15 blur-3xl"
    />
    <div
      class="pointer-events-none absolute right-0 bottom-0 size-96 rounded-full bg-accent/10 blur-3xl"
    />
    <Navbar class="relative z-10" />
    <main class="relative z-10 flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
