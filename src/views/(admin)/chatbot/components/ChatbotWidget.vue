<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-vue-next'
import { useChatbot } from '../composables/useChatbot'
import ChatbotPanel from './ChatbotPanel.vue'

const router = useRouter()
const { messages, isThinking, sendMessage } = useChatbot()

const isOpen = ref(false)

function handleViewOnMap(location: { lat: number; lng: number; name: string }): void {
  isOpen.value = false
  void router.push({
    name: 'admin-map',
    query: { lat: String(location.lat), lng: String(location.lng), label: location.name },
  })
}
</script>

<template>
  <div class="pointer-events-none fixed bottom-5 right-5 z-[1800] flex flex-col items-end gap-3">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="isOpen"
        class="pointer-events-auto h-[min(600px,calc(100svh-7rem))] w-[min(440px,calc(100vw-2.5rem))]"
      >
        <ChatbotPanel
          :messages="messages"
          :is-thinking="isThinking"
          @close="isOpen = false"
          @send="sendMessage"
          @view-on-map="handleViewOnMap"
        />
      </div>
    </transition>

    <Button
      size="icon"
      class="pointer-events-auto h-12 w-12 rounded-full shadow-lg"
      :aria-label="isOpen ? 'Close chat assistant' : 'Open chat assistant'"
      @click="isOpen = !isOpen"
    >
      <X v-if="isOpen" class="h-5 w-5" />
      <MessageCircle v-else class="h-5 w-5" />
    </Button>
  </div>
</template>
