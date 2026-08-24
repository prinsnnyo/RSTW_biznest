<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import InnerNavbar from '@/components/InnerNavbar.vue'
import EntrepreneurSidebar from '@/components/EntrepreneurSidebar.vue'
import ChatbotWidget from '@/views/(admin)/chatbot/components/ChatbotWidget.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const route = useRoute()
const isFullScreenMap = computed(() => route.name === 'entrepreneur-map')
</script>

<template>
  <div class="bg-far text-foreground flex h-screen flex-col overflow-hidden">
    <InnerNavbar :show-logout="false" />
    <SidebarProvider class="h-full min-h-0! flex-1">
      <EntrepreneurSidebar />
      <SidebarInset :class="isFullScreenMap ? 'min-h-0 overflow-hidden p-0' : 'overflow-y-auto'">
        <RouterView />
      </SidebarInset>
    </SidebarProvider>
    <ChatbotWidget />
  </div>
</template>
