export type UserRoleFilter = 'all' | 'user' | 'admin' | 'superadmin'

export interface UserRow {
  id: string
  username: string
  email: string
  role: string
  city: string
  cityId?: string
}

export interface UserRoleCounts {
  users: number
  admin: number
  superadmin: number
}

export interface RawUserMetaData {
  username?: string
  email?: string
  role?: string
  business_role?: string
  city?: string
  city_id?: string
  city_name?: string
  cityName?: string
}
