import type { Session, User } from '@supabase/supabase-js'
import type { LoginPayload, RegisterPayload } from '@/types/auth.types'
import { getSupabaseClient } from '@/services/supabase.client'

export interface AuthResponse {
  user: User | null
  session: Session | null
}

type AuthErrorField = 'email' | 'username' | 'password' | 'general'

export class AuthServiceError extends Error {
  readonly field: AuthErrorField
  readonly code?: string
  readonly status?: number
  readonly rawMessage?: string

  constructor(
    message: string,
    options?: {
      field?: AuthErrorField
      code?: string
      status?: number
      rawMessage?: string
    },
  ) {
    super(message)
    this.name = 'AuthServiceError'
    this.field = options?.field ?? 'general'
    this.code = options?.code
    this.status = options?.status
    this.rawMessage = options?.rawMessage
  }
}

const getRawAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : ''
  }

  return ''
}

const getRawAuthErrorCode = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }

  return undefined
}

const getRawAuthErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status
    return typeof status === 'number' ? status : undefined
  }

  return undefined
}

const mapSignUpError = (error: unknown): AuthServiceError => {
  const rawMessage = getRawAuthErrorMessage(error)
  const rawCode = getRawAuthErrorCode(error)
  const rawStatus = getRawAuthErrorStatus(error)
  const normalizedMessage = rawMessage.toLowerCase()

  if (normalizedMessage.includes('user already registered') || rawCode === 'user_already_exists') {
    return new AuthServiceError('This email is already registered. Try signing in instead.', {
      field: 'email',
      code: rawCode,
      status: rawStatus,
      rawMessage,
    })
  }

  if (normalizedMessage.includes('invalid email')) {
    return new AuthServiceError('Please enter a valid email address.', {
      field: 'email',
      code: rawCode,
      status: rawStatus,
      rawMessage,
    })
  }

  if (normalizedMessage.includes('password should be at least')) {
    return new AuthServiceError('Password must be at least 8 characters long.', {
      field: 'password',
      code: rawCode,
      status: rawStatus,
      rawMessage,
    })
  }

  if (normalizedMessage.includes('duplicate key value violates unique constraint')) {
    if (normalizedMessage.includes('username')) {
      return new AuthServiceError('This username is already taken. Please choose another one.', {
        field: 'username',
        code: rawCode,
        status: rawStatus,
        rawMessage,
      })
    }

    if (normalizedMessage.includes('email')) {
      return new AuthServiceError('This email is already registered. Try signing in instead.', {
        field: 'email',
        code: rawCode,
        status: rawStatus,
        rawMessage,
      })
    }
  }

  if (normalizedMessage.includes('database error saving new user')) {
    return new AuthServiceError(
      'Your account could not be saved due to a server registration issue. Please try again later or contact support.',
      {
        field: 'general',
        code: rawCode,
        status: rawStatus,
        rawMessage,
      },
    )
  }

  return new AuthServiceError(
    'Something went wrong while creating your account. Please try again.',
    {
      field: 'general',
      code: rawCode,
      status: rawStatus,
      rawMessage,
    },
  )
}

const mapSignInError = (error: unknown): AuthServiceError => {
  const rawMessage = getRawAuthErrorMessage(error)
  const rawCode = getRawAuthErrorCode(error)
  const rawStatus = getRawAuthErrorStatus(error)
  const normalizedMessage = rawMessage.toLowerCase()

  if (normalizedMessage.includes('email not confirmed')) {
    return new AuthServiceError(
      'Email not confirmed. Please confirm your email or request a new confirmation link.',
      {
        field: 'general',
        code: rawCode,
        status: rawStatus,
        rawMessage,
      },
    )
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return new AuthServiceError(
      'Invalid email or password. Please check your credentials and try again.',
      {
        field: 'general',
        code: rawCode,
        status: rawStatus,
        rawMessage,
      },
    )
  }

  return new AuthServiceError('Something went wrong. Please try again.', {
    field: 'general',
    code: rawCode,
    status: rawStatus,
    rawMessage,
  })
}

export const signInWithEmail = async (payload: LoginPayload): Promise<AuthResponse> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email.trim(),
    password: payload.password,
  })

  if (error) {
    throw mapSignInError(error)
  }

  return data
}

export const signUpWithEmail = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const supabase = getSupabaseClient()
  let role = 'user'

  if (payload.inviteToken) {
    const { data: isValidInvite, error: rpcError } = await supabase.rpc('consume_admin_invite', {
      token_to_consume: payload.inviteToken,
    })

    if (rpcError) {
      throw mapSignUpError(rpcError)
    }

    if (!isValidInvite) {
      throw new Error('The invitation link is invalid or has already been used.')
    }

    role = 'admin'
  }

  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim(),
    password: payload.password,
    options: {
      data: {
        username: payload.username.trim(),
        role: role,
        city_id: payload.city_id,
        city_name: payload.city_name,
      },
    },
  })

  if (error) {
    throw mapSignUpError(error)
  }

  return data
}
