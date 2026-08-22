import { ref } from 'vue'
import type {
  ChatMessage,
  ChatRecommendation,
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
const AUTO_CLOSE_DELAY_MS = 1600

type ConversationStep = 'menu' | 'business-type' | 'permit-type' | 'follow-up' | null

interface UseChatbotOptions {
  onConversationEnd?: () => void
}

interface AssistantReply {
  text: string
  recommendations?: ChatRecommendation[]
}

const WELCOME_TEXT =
  'Hi! I am the BizNest assistant. I can answer the following:\n' +
  '1. Business locations with space for rent\n' +
  '2. Business permit requirements\n\n' +
  'Please reply with 1 or 2, or just type your question directly.'

const MENU_RETRY_TEXT =
  'Please reply with:\n' +
  '1 - Business locations with space for rent\n' +
  '2 - Business permit requirements'

const WHICH_NUMBER_TEXT =
  'Great! Which one would you like to know about? Reply:\n' +
  '1 - Business locations with space for rent\n' +
  '2 - Business permit requirements'

const BUSINESS_TYPE_QUESTION =
  'What type of business would you like to put up? (e.g., coffee shop, restaurant, sari-sari store, printing services)'

const PERMIT_CLARIFYING_QUESTION =
  'Before I answer — is this for a NEW business permit application, or a RENEWAL of an existing one?'

const PERMIT_CLARIFYING_RETRY =
  'Sorry, I need one more detail: is this for a NEW business permit application or a RENEWAL?'

const FOLLOW_UP_QUESTION =
  '\n\nIs there anything else you would like to ask about?\n' +
  '1. Business locations with space for rent\n' +
  '2. Business permit requirements'

const THANK_YOU_TEXT =
  'Thank you for chatting with the BizNest assistant. Good luck with your business!'

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

function parseYesNo(message: string): 'yes' | 'no' | null {
  const normalized = message.toLowerCase().trim()

  if (/^(y|yes|yeah|yep|sure|oo|opo|sige)\b/.test(normalized)) {
    return 'yes'
  }

  if (/^(n|no|nope|none|wala)\b/.test(normalized)) {
    return 'no'
  }

  return null
}

export function useChatbot(options: UseChatbotOptions = {}) {
  const messages = ref<ChatMessage[]>([
    { id: createMessageId(), role: 'assistant', text: WELCOME_TEXT },
  ])
  const isThinking = ref(false)
  const conversationStep = ref<ConversationStep>('menu')

  let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

  function cancelPendingAutoClose(): void {
    if (autoCloseTimer !== null) {
      clearTimeout(autoCloseTimer)
      autoCloseTimer = null
    }
  }

  function scheduleAutoClose(): void {
    if (!options.onConversationEnd) {
      return
    }

    cancelPendingAutoClose()
    autoCloseTimer = setTimeout(() => {
      autoCloseTimer = null
      options.onConversationEnd?.()
    }, AUTO_CLOSE_DELAY_MS)
  }

  function reset(): void {
    cancelPendingAutoClose()
    isThinking.value = false
    conversationStep.value = 'menu'
    messages.value = [
      { id: createMessageId(), role: 'assistant', text: WELCOME_TEXT },
    ]
  }

  function withFollowUp(reply: AssistantReply): AssistantReply {
    conversationStep.value = 'follow-up'
    return { ...reply, text: reply.text + FOLLOW_UP_QUESTION }
  }

  async function resolvePermitFollowUp(message: string): Promise<AssistantReply> {
    const applicationType = parsePermitApplicationType(message)

    if (applicationType === null) {
      return { text: PERMIT_CLARIFYING_RETRY }
    }

    conversationStep.value = null

    if (applicationType === 'new') {
      return withFollowUp({ text: await getNewBusinessPermitRequirements() })
    }

    return withFollowUp({ text: await getRenewalBusinessPermitRequirements() })
  }

  async function buildLocationReply(businessType: string): Promise<AssistantReply> {
    const result = await getBusinessLocationRecommendations(businessType)

    return withFollowUp({
      text: result.intro,
      recommendations: result.spaces.map((space) => ({
        kind: 'rental-space' as const,
        space,
      })),
    })
  }

  async function handleFreeForm(message: string): Promise<AssistantReply> {
    const query = parseChatQuery(message)

    if (query.intent === 'registration-help' && isBusinessPermitQuestion(message)) {
      // The user may already have said "new" or "renewal" in the same message.
      const applicationType = parsePermitApplicationType(message)

      if (applicationType === 'new') {
        return withFollowUp({ text: await getNewBusinessPermitRequirements() })
      }

      if (applicationType === 'renewal') {
        return withFollowUp({ text: await getRenewalBusinessPermitRequirements() })
      }

      conversationStep.value = 'permit-type'
      return { text: PERMIT_CLARIFYING_QUESTION }
    }

    if (query.intent === 'unknown') {
      return withFollowUp({ text: FALLBACK_TEXT })
    }

    if (query.intent === 'registration-help') {
      return withFollowUp({ text: await getRegistrationAnswer(message) })
    }

    if (query.intent === 'nearby-search') {
      const category = query.establishmentCategory ?? 'establishment'
      const result = await getNearbyEstablishments(category)

      return withFollowUp({
        text: result.intro,
        recommendations: result.places.map((place) => ({
          kind: 'establishment' as const,
          place,
        })),
      })
    }

    return buildLocationReply(query.businessType ?? message)
  }

  async function buildReply(message: string): Promise<AssistantReply> {
    if (conversationStep.value === 'follow-up') {
      const answer = parseYesNo(message)

      if (answer === 'yes') {
        conversationStep.value = 'menu'
        return { text: WHICH_NUMBER_TEXT }
      }

      if (answer === 'no') {
        conversationStep.value = null
        scheduleAutoClose()
        return { text: THANK_YOU_TEXT }
      }

      // Not a yes/no — treat the message as a regular question below.
    }

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
      return buildLocationReply(message)
    } else if (conversationStep.value === 'permit-type') {
      return resolvePermitFollowUp(message)
    }

    return handleFreeForm(message)
  }

  async function sendMessage(rawText: string): Promise<void> {
    const trimmed = rawText.trim()
    if (!trimmed || isThinking.value) {
      return
    }

    cancelPendingAutoClose()
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

  return { messages, isThinking, sendMessage, reset }
}
