export const getRoleBadgeVariant = (
  role: string,
): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined => {
  const normalizedRole = role.trim().toLowerCase()
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
  const spaced = role.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')

  if (!spaced) {
    return ''
  }

  if (/[A-Z]/.test(spaced)) {
    return spaced
  }

  return spaced.replace(/\b\w/g, (character) => character.toUpperCase())
}
