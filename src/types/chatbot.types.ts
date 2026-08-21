export interface GeoPoint {
  lat: number
  lng: number
}

export type RentalSpaceType = 'retail' | 'office' | 'food-stall' | 'warehouse'

export interface RentalSpace {
  id: string
  name: string
  barangay: string
  address: string
  location: GeoPoint
  monthlyRent?: number
  areaSqm?: number
  spaceType: RentalSpaceType
  isAvailable: boolean
  suitableFor: string[]
  imageUrl?: string
  rating?: number
  contactNumber?: string
  description?: string
}

export interface Supplier {
  id: string
  name: string
  category: string
  barangay: string
  location: GeoPoint
  servesBusinessTypes: string[]
}

export interface Establishment {
  id: string
  name: string
  category: string
  barangay: string
  location: GeoPoint
  imageUrl?: string
}

export interface RegistrationTopic {
  id: string
  keywords: string[]
  question: string
  answer: string
}

export type ChatbotIntent =
  | 'location-recommendation'
  | 'registration-help'
  | 'nearby-search'
  | 'unknown'

export interface ParsedChatQuery {
  intent: ChatbotIntent
  businessType: string | null
  establishmentCategory: string | null
}

export type ChatRecommendation =
  | { kind: 'rental-space'; space: RentalSpace }
  | { kind: 'establishment'; place: Establishment }

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  recommendations?: ChatRecommendation[]
}
