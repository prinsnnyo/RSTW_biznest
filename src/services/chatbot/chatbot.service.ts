import type { Establishment, RentalSpace, Supplier } from '@/types/chatbot.types'
import { getDistanceKm } from '@/utils/geo.utils'
import { CITY_CENTER, ESTABLISHMENTS, REGISTRATION_TOPICS, RENTAL_SPACES, SUPPLIERS } from './chatbot.static-data'

export interface LocationRecommendationResult {
  intro: string
  spaces: RentalSpace[]
  suppliers: Supplier[]
}

export interface NearbyEstablishmentResult {
  intro: string
  places: Establishment[]
}

const normalize = (value: string): string => value.toLowerCase().trim()

const tokenize = (value: string): string[] =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)

function scoreRentalSpace(space: RentalSpace, businessType: string): number {
  const typeTokens = tokenize(businessType)
  const suitabilityText = normalize(space.suitableFor.join(' '))

  const tagScore = space.suitableFor.reduce((score, tag) => {
    const normalizedTag = normalize(tag)
    const isTokenMatch = typeTokens.some(
      (token) => normalizedTag.includes(token) || token.includes(normalizedTag),
    )
    return score + (isTokenMatch ? 2 : 0)
  }, 0)

  const textScore = typeTokens.filter((token) => suitabilityText.includes(token)).length
  const rentScore = space.isAvailable ? Math.max(0, 3 - space.monthlyRent / 10000) : -5

  return tagScore * 10 + textScore * 5 + rentScore
}

export async function getBusinessLocationRecommendations(
  businessType: string,
): Promise<LocationRecommendationResult> {
  const rankedSpaces = [...RENTAL_SPACES]
    .sort((a, b) => scoreRentalSpace(b, businessType) - scoreRentalSpace(a, businessType))
    .slice(0, 3)

  const topSpace = rankedSpaces[0]

  if (!topSpace) {
    return {
      intro: 'There are currently no rental spaces on record.',
      spaces: [],
      suppliers: [],
    }
  }

  const distanceFromTopSpace = (supplier: Supplier): number =>
    getDistanceKm(topSpace.location, supplier.location)

  const relevantSuppliers = SUPPLIERS.filter((supplier) =>
    supplier.servesBusinessTypes.some(
      (type) =>
        normalize(type).includes(normalize(businessType)) ||
        normalize(businessType).includes(normalize(type)),
    ),
  ).sort((a, b) => distanceFromTopSpace(a) - distanceFromTopSpace(b))

  const fallbackSuppliers = relevantSuppliers.length
    ? relevantSuppliers
    : [...SUPPLIERS].sort((a, b) => distanceFromTopSpace(a) - distanceFromTopSpace(b))

  return {
    intro: `Here are the top ${rankedSpaces.length} rental spaces suited for a ${businessType}, plus nearby suppliers you may need:`,
    spaces: rankedSpaces,
    suppliers: fallbackSuppliers.slice(0, 3),
  }
}

export async function getNearbyEstablishments(
  category: string,
): Promise<NearbyEstablishmentResult> {
  const normalizedCategory = normalize(category)

  const matchingPlaces = ESTABLISHMENTS.filter((place) => {
    const normalizedPlaceCategory = normalize(place.category)
    return (
      normalizedPlaceCategory.includes(normalizedCategory) ||
      normalizedCategory.includes(normalizedPlaceCategory)
    )
  })

  const places = (matchingPlaces.length ? matchingPlaces : ESTABLISHMENTS)
    .map((place) => ({
      place,
      distanceKm: getDistanceKm(CITY_CENTER, place.location),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3)
    .map((entry) => entry.place)

  return {
    intro: `The ${places.length} nearest ${category} options from the city center:`,
    places,
  }
}

export async function getRegistrationAnswer(question: string): Promise<string> {
  const questionTokens = tokenize(question)

  let bestTopic: { topic: (typeof REGISTRATION_TOPICS)[number]; score: number } | null = null

  for (const topic of REGISTRATION_TOPICS) {
    const topicTokens = topic.keywords.flatMap(tokenize)
    const score = topicTokens.reduce(
      (total, token) =>
        total + (questionTokens.some((q) => q === token || q.includes(token)) ? 1 : 0),
      0,
    )

    if (!bestTopic || score > bestTopic.score) {
      bestTopic = { topic, score }
    }
  }

  if (!bestTopic || bestTopic.score === 0) {
    return 'I can help with business registration topics such as DTI name registration, barangay clearance, zoning clearance, mayor\'s permit, BIR registration, employer obligations (SSS/PhilHealth/Pag-IBIG), and permit renewal deadlines. Which one would you like to know about?'
  }

  return bestTopic.topic.answer
}
