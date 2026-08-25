<script lang="ts">
export const description = 'A login page with form and image.'
</script>

<script setup lang="ts">
import LoginForm from './components/LoginForm.vue'
</script>

<template>
  <div class="flex min-h-full flex-col items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm md:max-w-4xl">
      <LoginForm />
    </div>
  </div>
</template>
