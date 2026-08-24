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
  inviteToken?: string
}
