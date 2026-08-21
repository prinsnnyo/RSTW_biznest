import { ref } from 'vue'
import type {
  ChatMessage,
  ChatRecommendation,
  ParsedChatQuery,
} from '@/types/chatbot.types'
import {
  getBusinessLocationRecommendations,
  getNearbyEstablishments,
  getRegistrationAnswer,
} from '@/services/chatbot/chatbot.service'
import { parseChatQuery } from '../utils/chatbot-intent.utils'

const TYPING_DELAY_MS = 400

const WELCOME_TEXT =
  'Hi! I am the BizNest assistant. I can help you with:\n' +
  '1. Recommending business locations and rental spaces\n' +
  '2. Business registration, permits, and regulations\n' +
  '3. Finding nearby establishments'

let messageIdCounter = 0

function createMessageId(): string {
  messageIdCounter += 1
  return `chat-msg-${messageIdCounter}`
}

function buildRecommendationReply(query: ParsedChatQuery, message: string): Promise<{
  text: string
  recommendations?: ChatRecommendation[]
}> {
  if (query.intent === 'registration-help') {
    return getRegistrationAnswer(message).then((text) => ({ text }))
  }

  if (query.intent === 'nearby-search') {
    const category = query.establishmentCategory ?? 'establishment'
    return getNearbyEstablishments(category).then((result) => ({
      text: result.intro,
      recommendations: result.places.map((place) => ({ kind: 'establishment' as const, place })),
    }))
  }

  const businessType = query.businessType ?? 'sari-sari store'
  return getBusinessLocationRecommendations(businessType).then((result) => ({
    text: result.intro,
    recommendations: result.spaces.map((space) => ({ kind: 'rental-space' as const, space })),
  }))
}

export function useChatbot() {
  const messages = ref<ChatMessage[]>([
    { id: createMessageId(), role: 'assistant', text: WELCOME_TEXT },
  ])
  const isThinking = ref(false)

  async function sendMessage(rawText: string): Promise<void> {
    const trimmed = rawText.trim()
    if (!trimmed || isThinking.value) {
      return
    }

    messages.value.push({ id: createMessageId(), role: 'user', text: trimmed })
    isThinking.value = true

    try {
      const query = parseChatQuery(trimmed)
      const reply =
        query.intent === 'unknown'
          ? {
              text:
                'Sorry, I did not quite get that. You can ask me to:\n' +
                '- Recommend a location for your business (e.g. "best place for a coffee shop")\n' +
                '- Explain business permits and registration (e.g. "what are the requirements?")\n' +
                '- Find nearby establishments (e.g. "nearest restaurant")',
            }
          : await buildRecommendationReply(query, trimmed)

      // Small delay so the assistant feels like it is typing.
      await new Promise((resolve) => setTimeout(resolve, TYPING_DELAY_MS))

      messages.value.push({
        id: createMessageId(),
        role: 'assistant',
        text: reply.text,
        recommendations: reply.recommendations,
      })
    } finally {
      isThinking.value = false
    }
  }

  return { messages, isThinking, sendMessage }
}
