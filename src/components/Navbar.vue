<script setup lang="ts">
defineOptions({
  name: 'AppNavbar',
})

import { RouterLink } from 'vue-router'
import ModeToggle from '@/components/ui/ModeToggle.vue'
import { Button } from '@/components/ui/button'
import logoImage from '@/assets/images/logo.png'
</script>

<template>
  <nav class="sticky top-0 z-[2000] border-b bg-card/70 backdrop-blur">
    <div class="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4">
      <RouterLink
        to="/"
        class="text-md text-foreground dark:text-primary inline-flex items-center gap-3 font-semibold tracking-wide"
      >
        <span
          class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-1 ring-border shadow-lg"
        >
          <img
            :src="logoImage"
            alt="BizNest logo"
            class="h-full w-full object-contain dark:brightness-90"
          />
        </span>
        <span class="text-xl">BizNest</span>
      </RouterLink>

      <div class="flex items-center gap-4">
        <Button as-child variant="ghost" size="sm">
          <RouterLink to="/">Home</RouterLink>
        </Button>
        <Button as-child variant="ghost" size="sm">
          <RouterLink to="/about">About</RouterLink>
        </Button>
        <ModeToggle />
        <Button as-child size="sm" class="rounded-full px-5 shadow-md shadow-accent/20">
          <RouterLink to="/login">Get Started</RouterLink>
        </Button>
      </div>
    </div>
  </nav>
</template>
