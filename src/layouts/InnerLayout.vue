<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AdminSidebar from '@/components/AdminSidebar.vue'
import InnerNavbar from '@/components/InnerNavbar.vue'
import ChatbotWidget from '@/views/(admin)/chatbot/components/ChatbotWidget.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

// `sidebar` lets non-admin shells (e.g. the normal-user shell) reuse this chrome
// with their own nav. Defaults to the admin sidebar.
const props = defineProps<{
  sidebar?: Component
}>()

const route = useRoute()
const isFullScreenMap = computed(
  () => route.name === 'admin-map' || route.name === 'user-map' || route.path.endsWith('/map'),
)
</script>

<template>
  <div class="bg-far text-foreground flex h-screen flex-col overflow-hidden">
    <InnerNavbar v-if="!isFullScreenMap" />
    <SidebarProvider class="h-full min-h-0! flex-1">
      <component :is="props.sidebar ?? AdminSidebar" />
      <SidebarInset :class="isFullScreenMap ? 'min-h-0 overflow-hidden p-0' : 'overflow-y-auto'">
        <RouterView />
      </SidebarInset>
    </SidebarProvider>
    <ChatbotWidget />
  </div>
</template>
