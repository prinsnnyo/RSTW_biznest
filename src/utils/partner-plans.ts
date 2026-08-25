export type PartnerPlanId = 'free' | 'presence' | 'visibility'

export interface PartnerPlan {
  id: PartnerPlanId
  name: string
  price: number
  tagline: string
  featured?: boolean
  grants: string[]
}

const PLAN_ID_ALIASES: Record<string, PartnerPlanId> = {
  starter: 'free',
  growth: 'presence',
  pro: 'visibility',
}

export const PARTNER_PLANS: PartnerPlan[] = [
  {
    id: 'free',
    name: 'Be Found',
    price: 0,
    tagline: 'Basic business listing, map location, and business information.',
    grants: [
      'Basic business listing on BizNest',
      'Map location pin',
      'Public business information',
    ],
  },
  {
    id: 'presence',
    name: 'Build Your Presence',
    price: 299,
    tagline:
      'Managed BizNest business profile with enhanced information, photos, location details, and customer connection.',
    grants: [
      'Managed BizNest business profile',
      'Enhanced information and photos',
      'Richer location details',
      'Connect with customers',
    ],
  },
  {
    id: 'visibility',
    name: 'Get More Visibility',
    price: 599,
    tagline: 'Featured exposure, enhanced visibility, and additional business tools.',
    featured: true,
    grants: [
      'Featured exposure on the platform',
      'Enhanced map and listing visibility',
      'Additional business tools',
    ],
  },
]

export const canonicalizePlanId = (value: unknown): PartnerPlanId | null => {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw.length === 0) {
    return null
  }
  const resolved = PLAN_ID_ALIASES[raw] ?? raw
  return PARTNER_PLANS.some((plan) => plan.id === resolved) ? (resolved as PartnerPlanId) : null
}

export const formatPlanPrice = (price: number): string =>
  price === 0 ? 'Free' : `₱${price.toLocaleString('en-PH')}`

export const formatPlanRate = (plan: Pick<PartnerPlan, 'price'>): string =>
  plan.price === 0 ? 'Free' : `${formatPlanPrice(plan.price)}/month`

export const getPartnerPlan = (id: PartnerPlanId): PartnerPlan => {
  const match = PARTNER_PLANS.find((plan) => plan.id === id)
  if (match) {
    return match
  }
  const presence = PARTNER_PLANS.find((plan) => plan.id === 'presence')
  if (presence) {
    return presence
  }
  throw new Error('Partner plans are missing')
}
