<script setup lang="ts">
import UserMapShell from '@/components/map/UserMapShell.vue'
import PinLocationControls from '@/views/(space-owner)/map/components/PinLocationControls.vue'
</script>

<template>
  <!-- The normal-user map shell, plus the pin tool. -->
  <UserMapShell>
    <PinLocationControls />
  </UserMapShell>
</template>
