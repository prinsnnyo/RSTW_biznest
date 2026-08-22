<script setup lang="ts">
import { type Component } from 'vue'
import { RouterView } from 'vue-router'
import AdminSidebar from '@/components/AdminSidebar.vue'
import InnerNavbar from '@/components/InnerNavbar.vue'
import ChatbotWidget from '@/views/(admin)/chatbot/components/ChatbotWidget.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

// `sidebar` lets non-admin shells (e.g. the normal-user shell) reuse this chrome
// with their own nav. Defaults to the admin sidebar.
const props = defineProps<{
  sidebar?: Component
}>()
</script>

<template>
  <div class="flex h-screen overflow-hidden flex-col bg-far text-foreground">
    <InnerNavbar />
    <SidebarProvider class="flex-1 min-h-0">
      <component :is="props.sidebar ?? AdminSidebar" />
      <SidebarInset class="overflow-y-auto">
        <RouterView />
      </SidebarInset>
    </SidebarProvider>
    <ChatbotWidget />
  </div>
</template>
