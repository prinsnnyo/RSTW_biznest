export type PartnerPlanId = 'starter' | 'growth' | 'pro'

export interface PartnerPlan {
  id: PartnerPlanId
  name: string
  price: number
  tagline: string
  featured?: boolean
  grants: string[]
}

export const PARTNER_PLANS: PartnerPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    tagline: 'Get listed and open your first public pin.',
    grants: [
      'Apply as space owner, entrepreneur, or supplier',
      'One published map pin in Butuan',
      'Public website linked from View Details',
      'Standard listing in city search',
      'Partner review in the usual queue',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 799,
    tagline: 'Stand out on the map and talk to visitors.',
    featured: true,
    grants: [
      'Everything in Starter',
      'Priority pin placement on the city map',
      'Messages inbox from your site Contact form',
      'Extra map photos and richer pin card',
      'Faster application review',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    tagline: 'Full partner toolkit for growing operators.',
    grants: [
      'Everything in Growth',
      'All website templates unlocked',
      'Featured in assistant space suggestions',
      'Highest review priority',
      'Concierge help on listing and site setup',
    ],
  },
]

export const formatPlanPrice = (price: number): string =>
  `₱${price.toLocaleString('en-PH')}`
