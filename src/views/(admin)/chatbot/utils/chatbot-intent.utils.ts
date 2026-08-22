import type { ChatbotIntent, ParsedChatQuery } from '@/types/chatbot.types'

const REGISTRATION_KEYWORDS = [
  'permit',
  'permits',
  'requirement',
  'requirements',
  'register',
  'registration',
  'license',
  'licence',
  'dti',
  'bir',
  'sss',
  'philhealth',
  'pag-ibig',
  'clearance',
  'regulation',
  'regulations',
  'renew',
  'renewal',
  'legal',
  'compliance',
  'tax',
]

const NEARBY_KEYWORDS = [
  'near',
  'nearest',
  'nearby',
  'around',
  'close',
  'closest',
  'where can i',
  'where to',
  'find me',
  'looking for a',
]

const RECOMMENDATION_KEYWORDS = [
  'recommend',
  'recommendation',
  'best place',
  'best location',
  'put up',
  'put-up',
  'open a business',
  'start a business',
  'starting a business',
  'rental space',
  'space for rent',
  'for rent',
  'suitable location',
  'business location',
  'supplier',
  'suppliers',
]

const BUSINESS_TYPES: Array<{ label: string; aliases: string[] }> = [
  { label: 'sari-sari store', aliases: ['sari sari', 'sari-sari', 'variety store'] },
  { label: 'coffee shop', aliases: ['coffee shop', 'cafe', 'café', 'kapehan', 'coffee'] },
  { label: 'restaurant', aliases: ['restaurant', 'eatery', 'carinderia', 'food business', 'food'] },
  { label: 'food stall', aliases: ['food stall', 'snack house', 'milk tea'] },
  { label: 'grocery', aliases: ['grocery', 'mini mart', 'minimart', 'supermarket'] },
  { label: 'pharmacy', aliases: ['pharmacy', 'drugstore', 'botika'] },
  { label: 'bakery', aliases: ['bakery', 'bakeshop', 'bread'] },
  { label: 'hardware', aliases: ['hardware', 'construction supplies'] },
  { label: 'salon', aliases: ['salon', 'barber shop', 'barbershop', 'beauty'] },
  { label: 'laundry shop', aliases: ['laundry'] },
  { label: 'printing services', aliases: ['printing', 'print shop', 'photocopy'] },
  { label: 'electronics repair', aliases: ['electronics repair', 'gadget repair', 'repair shop'] },
  { label: 'tutorial center', aliases: ['tutorial', 'review center', 'tutoring'] },
  { label: 'clothing boutique', aliases: ['boutique', 'clothing', 'apparel', 'ukay'] },
  { label: 'water refilling station', aliases: ['water refilling', 'water station'] },
  { label: 'meat shop', aliases: ['meat shop', 'butcher'] },
  { label: 'flower shop', aliases: ['flower shop', 'florist'] },
]

const ESTABLISHMENT_CATEGORIES: Array<{ label: string; aliases: string[] }> = [
  { label: 'coffee shop', aliases: ['coffee shop', 'cafe', 'café', 'kapehan', 'coffee'] },
  { label: 'restaurant', aliases: ['restaurant', 'place to eat', 'eatery', 'dine', 'food'] },
  { label: 'department store', aliases: ['department store', 'mall', 'shopping'] },
  { label: 'grocery', aliases: ['grocery', 'supermarket', 'super market'] },
  { label: 'pharmacy', aliases: ['pharmacy', 'drugstore'] },
]

const containsAny = (text: string, phrases: string[]): boolean =>
  phrases.some((phrase) => text.includes(phrase))

const BUSINESS_PERMIT_PHRASES = ['business permit', 'mayors permit', "mayor's permit", 'mayor permit']

export type PermitApplicationType = 'new' | 'renewal'

const NEW_PERMIT_PATTERN = /\b(new|fresh|first time|first-time|apply|applying|register|registration)\b/
const RENEWAL_PERMIT_PATTERN = /\b(renew|renewal|renewing|re-apply|reapply|existing)\b/

export function isBusinessPermitQuestion(message: string): boolean {
  const normalized = message.toLowerCase().trim()
  return (
    containsAny(normalized, BUSINESS_PERMIT_PHRASES) ||
    (normalized.includes('permit') && normalized.includes('business'))
  )
}

export function parsePermitApplicationType(message: string): PermitApplicationType | null {
  const normalized = message.toLowerCase().trim()

  if (RENEWAL_PERMIT_PATTERN.test(normalized)) {
    return 'renewal'
  }

  if (NEW_PERMIT_PATTERN.test(normalized)) {
    return 'new'
  }

  return null
}

function matchCatalogEntry(
  text: string,
  catalog: Array<{ label: string; aliases: string[] }>,
): string | null {
  for (const entry of catalog) {
    if (containsAny(text, entry.aliases)) {
      return entry.label
    }
  }
  return null
}

export function parseChatQuery(rawMessage: string): ParsedChatQuery {
  const message = rawMessage.toLowerCase().trim()

  const isRegistration = containsAny(message, REGISTRATION_KEYWORDS)
  const isNearby = containsAny(message, NEARBY_KEYWORDS)
  const isRecommendation = containsAny(message, RECOMMENDATION_KEYWORDS)

  let intent: ChatbotIntent = 'unknown'
  if (isRegistration) {
    intent = 'registration-help'
  } else if (isNearby || (!isRecommendation && matchCatalogEntry(message, ESTABLISHMENT_CATEGORIES))) {
    intent = 'nearby-search'
  } else if (isRecommendation) {
    intent = 'location-recommendation'
  }

  return {
    intent,
    businessType: intent === 'location-recommendation' ? matchCatalogEntry(message, BUSINESS_TYPES) : null,
    establishmentCategory:
      intent === 'nearby-search' ? matchCatalogEntry(message, ESTABLISHMENT_CATEGORIES) : null,
  }
}
