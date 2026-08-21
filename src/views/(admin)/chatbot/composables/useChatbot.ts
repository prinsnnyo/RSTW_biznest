import { ref } from 'vue'
import type {
  ChatMessage,
  ChatRecommendation,
  ParsedChatQuery,
} from '@/types/chatbot.types'
import {
  getBusinessLocationRecommendations,
  getNearbyEstablishments,
  getNewBusinessPermitRequirements,
  getRegistrationAnswer,
  getRenewalBusinessPermitRequirements,
} from '@/services/chatbot/chatbot.service'
import {
  isBusinessPermitQuestion,
  parseChatQuery,
  parsePermitApplicationType,
} from '../utils/chatbot-intent.utils'

const TYPING_DELAY_MS = 400

type ConversationStep = 'menu' | 'business-type' | 'permit-type' | null

const WELCOME_TEXT =
  'Hi! I am the BizNest assistant. I can answer the following:\n' +
  '1. Business locations with space for rent\n' +
  '2. Business permit requirements\n\n' +
  'Please reply with 1 or 2, or just type your question directly.'

const MENU_RETRY_TEXT =
  'Please reply with:\n' +
  '1 - Business locations with space for rent\n' +
  '2 - Business permit requirements'

const BUSINESS_TYPE_QUESTION =
  'What type of business would you like to put up? (e.g., coffee shop, restaurant, sari-sari store, printing services)'

const PERMIT_CLARIFYING_QUESTION =
  'Before I answer — is this for a NEW business permit application, or a RENEWAL of an existing one?'

const PERMIT_CLARIFYING_RETRY =
  'Sorry, I need one more detail: is this for a NEW business permit application or a RENEWAL?'

const FALLBACK_TEXT =
  'Sorry, I did not quite get that. You can ask me to:\n' +
  '- Recommend a location for your business (e.g. "best place for a coffee shop")\n' +
  '- Explain business permits and registration (e.g. "what are the requirements?")\n' +
  '- Find nearby establishments (e.g. "nearest restaurant")'

let messageIdCounter = 0

function createMessageId(): string {
  messageIdCounter += 1
  return `chat-msg-${messageIdCounter}`
}

function parseMenuChoice(message: string): 'locations' | 'permits' | null {
  const normalized = message.toLowerCase().trim()

  if (/^1\b/.test(normalized) || normalized.includes('space for rent') || normalized.includes('location')) {
    return 'locations'
  }

  if (
    /^2\b/.test(normalized) ||
    normalized.includes('permit') ||
    normalized.includes('registration') ||
    normalized.includes('renew')
  ) {
    return 'permits'
  }

  return null
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

  const businessType = query.businessType ?? message
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
  const conversationStep = ref<ConversationStep>('menu')

  async function resolvePermitFollowUp(message: string): Promise<{
    text: string
    recommendations?: ChatRecommendation[]
  }> {
    const applicationType = parsePermitApplicationType(message)

    if (applicationType === null) {
      return { text: PERMIT_CLARIFYING_RETRY }
    }

    conversationStep.value = null

    if (applicationType === 'new') {
      return { text: await getNewBusinessPermitRequirements() }
    }

    return { text: await getRenewalBusinessPermitRequirements() }
  }

  async function buildReply(message: string): Promise<{
    text: string
    recommendations?: ChatRecommendation[]
  }> {
    if (conversationStep.value === 'menu') {
      const choice = parseMenuChoice(message)

      if (choice === 'locations') {
        conversationStep.value = 'business-type'
        return { text: BUSINESS_TYPE_QUESTION }
      }

      if (choice === 'permits') {
        conversationStep.value = 'permit-type'
        return { text: PERMIT_CLARIFYING_QUESTION }
      }

      // Not a menu answer and not a recognizable question — re-show the choices.
      const query = parseChatQuery(message)
      if (query.intent === 'unknown') {
        return { text: MENU_RETRY_TEXT }
      }

      // Otherwise fall through to free-form handling below.
    } else if (conversationStep.value === 'business-type') {
      conversationStep.value = null
      const result = await getBusinessLocationRecommendations(message)
      return {
        text: result.intro,
        recommendations: result.spaces.map((space) => ({
          kind: 'rental-space' as const,
          space,
        })),
      }
    } else if (conversationStep.value === 'permit-type') {
      return resolvePermitFollowUp(message)
    }

    const query = parseChatQuery(message)

    if (query.intent === 'registration-help' && isBusinessPermitQuestion(message)) {
      // The user may already have said "new" or "renewal" in the same message.
      const applicationType = parsePermitApplicationType(message)

      if (applicationType === 'new') {
        return { text: await getNewBusinessPermitRequirements() }
      }

      if (applicationType === 'renewal') {
        return { text: await getRenewalBusinessPermitRequirements() }
      }

      conversationStep.value = 'permit-type'
      return { text: PERMIT_CLARIFYING_QUESTION }
    }

    if (query.intent === 'unknown') {
      return { text: FALLBACK_TEXT }
    }

    return buildRecommendationReply(query, message)
  }

  async function sendMessage(rawText: string): Promise<void> {
    const trimmed = rawText.trim()
    if (!trimmed || isThinking.value) {
      return
    }

    messages.value.push({ id: createMessageId(), role: 'user', text: trimmed })
    isThinking.value = true

    try {
      const reply = await buildReply(trimmed)

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
