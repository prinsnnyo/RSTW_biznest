<script setup lang="ts">
import type { ChatMessage } from '@/types/chatbot.types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TypographySmall } from '@/components/typography'
import { Bot, User } from 'lucide-vue-next'
import ChatRecommendationCard from './ChatRecommendationCard.vue'

defineProps<{ message: ChatMessage }>()

const emit = defineEmits<{
  'view-on-map': [location: { lat: number; lng: number; name: string; id?: string }]
}>()
</script>

<template>
  <div class="flex gap-2" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
    <Avatar v-if="message.role === 'assistant'" class="h-7 w-7 shrink-0 border">
      <AvatarFallback class="bg-primary/10 text-primary">
        <Bot class="h-4 w-4" />
      </AvatarFallback>
    </Avatar>

    <div class="max-w-[85%] space-y-2">
      <div
        class="rounded-xl px-3 py-2"
        :class="
          message.role === 'user'
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
        "
      >
        <TypographySmall as="p" class="whitespace-pre-line">{{ message.text }}</TypographySmall>
      </div>

      <ChatRecommendationCard
        v-for="recommendation in message.recommendations ?? []"
        :key="`${message.id}-${recommendation.kind}-${recommendation.kind === 'rental-space' ? recommendation.space.id : recommendation.place.id}`"
        :recommendation="recommendation"
        @view-on-map="emit('view-on-map', $event)"
      />
    </div>

    <Avatar v-if="message.role === 'user'" class="h-7 w-7 shrink-0 border">
      <AvatarFallback class="bg-muted">
        <User class="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  </div>
</template>
