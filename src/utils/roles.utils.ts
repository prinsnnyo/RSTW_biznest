const ROLE_ALIASES: Record<string, string> = {
  entreprenuer: 'entrepreneur',
}

export const BUSINESS_ROLE_KEYS = ['space_owner', 'entrepreneur', 'supplier'] as const

export const toRoleKey = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s-]+/g, '_')

export const canonicalizeRole = (value: string): string => {
  const key = toRoleKey(value)
  return ROLE_ALIASES[key] ?? key
}

export const isBusinessRoleKey = (value: string): boolean =>
  BUSINESS_ROLE_KEYS.includes(canonicalizeRole(value) as (typeof BUSINESS_ROLE_KEYS)[number])

/** Prefer an assigned partner role unless the account is admin. */
export const resolveDisplayRole = (role?: string | null, businessRole?: string | null): string => {
  const platformRole = canonicalizeRole(role ?? '')
  const partnerRole = canonicalizeRole(businessRole ?? '')

  if (platformRole === 'admin' || platformRole === 'superadmin') {
    return platformRole
  }

  if (partnerRole && isBusinessRoleKey(partnerRole)) {
    return partnerRole
  }

  return platformRole || 'user'
}

export const getRoleBadgeVariant = (
  role: string,
): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined => {
  const normalizedRole = canonicalizeRole(role)
  switch (normalizedRole) {
    case 'superadmin':
      return 'destructive'
    case 'admin':
      return 'default'
    case 'user':
    default:
      return 'secondary'
  }
}

/**
 * Turns a stored role value into a display label.
 * Slug-ish values are title-cased ("space_owner" -> "Space Owner"); titles that
 * already carry their own casing ("IT Admin") are left untouched.
 */
export const formatRoleLabel = (role: string): string => {
  const canonical = canonicalizeRole(role)
  const spaced = canonical.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')

  if (!spaced) {
    return ''
  }

  return spaced.replace(/\b\w/g, (character) => character.toUpperCase())
}
