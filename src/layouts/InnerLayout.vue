<script setup lang="ts">
import { RouterView } from 'vue-router'
import AdminSidebar from '@/components/AdminSidebar.vue'
import InnerNavbar from '@/components/InnerNavbar.vue'
import ChatbotWidget from '@/views/(admin)/chatbot/components/ChatbotWidget.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <div class="flex h-screen overflow-hidden flex-col bg-far text-foreground">
    <InnerNavbar />
    <SidebarProvider class="flex-1 min-h-0">
      <AdminSidebar />
      <SidebarInset class="overflow-y-auto">
        <RouterView />
      </SidebarInset>
    </SidebarProvider>
    <ChatbotWidget />
  </div>
</template>
