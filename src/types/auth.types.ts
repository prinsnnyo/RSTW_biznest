import type { BusinessRole } from '@/types/pinned-location.types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  city_id: string
  city_name: string
  business_role?: BusinessRole | null
  inviteToken?: string
}
