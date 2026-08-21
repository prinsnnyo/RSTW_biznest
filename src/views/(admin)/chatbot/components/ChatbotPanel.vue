<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ChatMessage } from '@/types/chatbot.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { Bot, Send, X } from 'lucide-vue-next'
import ChatMessageItem from './ChatMessageItem.vue'

const props = defineProps<{
  messages: ChatMessage[]
  isThinking: boolean
}>()

const emit = defineEmits<{
  close: []
  send: [text: string]
  'view-on-map': [location: { lat: number; lng: number; name: string }]
}>()

const draft = ref('')
const messageListRef = ref<HTMLDivElement | null>(null)

function handleSend(): void {
  const text = draft.value.trim()
  if (!text) {
    return
  }

  draft.value = ''
  emit('send', text)
}

watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    messageListRef.value?.scrollTo({ top: messageListRef.value.scrollHeight, behavior: 'smooth' })
  },
)

watch(
  () => props.isThinking,
  async () => {
    if (!props.isThinking) {
      return
    }
    await nextTick()
    messageListRef.value?.scrollTo({ top: messageListRef.value.scrollHeight, behavior: 'smooth' })
  },
)
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xl">
    <!-- Header -->
    <div class="flex items-center gap-2 px-3 py-2.5">
      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot class="h-4 w-4" />
      </span>
      <div class="min-w-0 flex-1">
        <TypographySmall as="p" class="font-semibold">BizNest Assistant</TypographySmall>
        <TypographyMuted as="p" class="text-[11px]">Ask me anything about business</TypographyMuted>
      </div>
      <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Close chat" @click="emit('close')">
        <X class="h-4 w-4" />
      </Button>
    </div>

    <Separator />

    <!-- Messages -->
    <div ref="messageListRef" class="flex-1 space-y-3 overflow-y-auto px-3 py-3">
      <ChatMessageItem
        v-for="message in messages"
        :key="message.id"
        :message="message"
        @view-on-map="emit('view-on-map', $event)"
      />

      <div v-if="isThinking" class="flex gap-2">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot class="h-4 w-4" />
        </span>
        <div class="flex items-center gap-1 rounded-xl rounded-tl-sm bg-muted px-3 py-2.5">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"></span>
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]"></span>
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]"></span>
        </div>
      </div>
    </div>

    <Separator />

    <!-- Input -->
    <form class="flex items-center gap-2 p-2.5" @submit.prevent="handleSend">
      <Input v-model="draft" placeholder="Type a message..." autocomplete="off" />
      <Button type="submit" size="icon" class="h-9 w-9 shrink-0" aria-label="Send message" :disabled="isThinking || !draft.trim()">
        <Send class="h-4 w-4" />
      </Button>
    </form>
  </div>
</template>
