<script setup lang="ts">
import UserSidebar from '@/components/UserSidebar.vue'
import { primarySpaceOwnerNavItems } from '@/utils/space-owner-sidebar-nav'

// The space-owner shell is the normal-user shell with its own nav targets, so
// the sidebar chrome is shared rather than copied.
</script>

<template>
  <UserSidebar :items="primarySpaceOwnerNavItems" />
</template>
