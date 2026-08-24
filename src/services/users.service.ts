import type { UserRow, RawUserMetaData } from '@/views/(admin)/users/types/users-table.types'
import { getSupabaseClient } from '@/services/supabase.client'
import { fetchPhilippineCities, toCityNameMap } from '@/services/cities.service'
import { canonicalizeRole, isBusinessRoleKey, resolveDisplayRole } from '@/utils/roles.utils'

type GenericDbRow = Record<string, unknown>

const PROFILE_TABLE = 'auth.users'
const GET_ALL_USERS_RPC = 'get_all_users'

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unable to fetch users right now. Please try again.'
}

const asRecord = (value: unknown): GenericDbRow => {
  if (typeof value === 'object' && value !== null) {
    return value as GenericDbRow
  }

  return {}
}

const getText = (row: GenericDbRow, keys: string[]): string => {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return ''
}

const getOptionalText = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return null
}

const isLikelyCityId = (value: string): boolean => /^\d{4,}$/.test(value)

const getCityMetadata = (
  meta: RawUserMetaData,
): {
  cityId: string
  cityName: string
} => {
  const cityIdFromDedicatedField = getOptionalText(meta.city_id) ?? ''
  const cityNameFromDedicatedField = getOptionalText(meta.city_name ?? meta.cityName) ?? ''
  const cityFromLegacyField = getOptionalText(meta.city) ?? ''
  const legacyCityLooksLikeId = cityFromLegacyField ? isLikelyCityId(cityFromLegacyField) : false

  if (cityIdFromDedicatedField) {
    return {
      cityId: cityIdFromDedicatedField,
      cityName: cityNameFromDedicatedField || (legacyCityLooksLikeId ? '' : cityFromLegacyField),
    }
  }

  if (legacyCityLooksLikeId) {
    return {
      cityId: cityFromLegacyField,
      cityName: cityNameFromDedicatedField,
    }
  }

  return {
    cityId: '',
    cityName: cityNameFromDedicatedField || cityFromLegacyField,
  }
}

const toRawUserMetaData = (input: unknown): RawUserMetaData => {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as RawUserMetaData
      return parsed
    } catch {
      console.error('Failed to parse raw_user_meta_data JSON')
      return {}
    }
  }

  if (typeof input === 'object' && input !== null) {
    return input as RawUserMetaData
  }

  return {}
}

const toUserRow = (input: unknown, cityNameById: Map<string, string>): UserRow | null => {
  const row = asRecord(input)

  const id = getText(row, ['id', 'user_id'])
  if (!id) {
    return null
  }

  let username = 'Unknown User'
  let email = 'No email'
  let role = 'user'
  const meta = toRawUserMetaData(row['raw_user_meta_data'])
  username = meta.username || username
  email = meta.email || email
  role = resolveDisplayRole(meta.role, meta.business_role)

  const cityMeta = getCityMetadata(meta)
  const cityName = cityMeta.cityId
    ? cityNameById.get(cityMeta.cityId) || cityMeta.cityName || cityMeta.cityId
    : cityMeta.cityName

  return {
    id,
    username,
    email,
    role,
    city: cityName,
    cityId: cityMeta.cityId || undefined,
  }
}

const mapRows = (rows: unknown[] | null, cityNameById: Map<string, string>): UserRow[] => {
  if (!rows) {
    return []
  }

  return rows
    .map((row) => toUserRow(row, cityNameById))
    .filter((row): row is UserRow => row !== null)
}

const shouldFallbackFromRpc = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) {
    return false
  }

  const message = (error.message ?? '').toLowerCase()
  return error.code === '42883' || message.includes(GET_ALL_USERS_RPC)
}

export const fetchAllUsers = async (): Promise<UserRow[]> => {
  const supabase = getSupabaseClient()
  let cityNameById = new Map<string, string>()

  try {
    cityNameById = toCityNameMap(await fetchPhilippineCities())
  } catch {
    cityNameById = new Map<string, string>()
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(GET_ALL_USERS_RPC)

  if (!rpcError) {
    return mapRows(Array.isArray(rpcData) ? rpcData : null, cityNameById)
  }

  if (!shouldFallbackFromRpc(rpcError)) {
    throw new Error(getErrorMessage(rpcError))
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from(PROFILE_TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    throw new Error(getErrorMessage(profilesError))
  }

  return mapRows(Array.isArray(profilesData) ? profilesData : null, cityNameById)
}

export const updateUserProfile = async (
  userId: string,
  updates: { username?: string; role?: string; city?: string; cityId?: string },
): Promise<void> => {
  const supabase = getSupabaseClient()
  const metadataUpdates: Record<string, string> = {}
  let resolvedCityName = updates.city

  if (!resolvedCityName && updates.cityId) {
    try {
      const cityNameById = toCityNameMap(await fetchPhilippineCities())
      resolvedCityName = cityNameById.get(updates.cityId)
    } catch {
      resolvedCityName = undefined
    }
  }

  if (updates.username !== undefined) {
    metadataUpdates.username = updates.username
  }

  if (updates.role !== undefined) {
    const canonicalRole = canonicalizeRole(updates.role)
    metadataUpdates.role = canonicalRole
    metadataUpdates.business_role = isBusinessRoleKey(canonicalRole) ? canonicalRole : ''
  }

  if (resolvedCityName !== undefined) {
    metadataUpdates.city_name = resolvedCityName
  }

  if (updates.cityId !== undefined) {
    metadataUpdates.city_id = updates.cityId
  }

  if (Object.keys(metadataUpdates).length === 0) {
    return
  }

  // Since we don't have direct access to auth.admin, calling an RPC is the best practice
  // if you have `update_user_admin` set up. Otherwise, this might act as a placeholder.
  // Assuming a custom RPC 'update_user_admin' exists, or 'auth.users' is directly updatable
  // by service logic.

  const { error } = await supabase.rpc('update_user_metadata_rpc', {
    target_user_id: userId,
    meta_updates: metadataUpdates,
  })

  if (error) {
    // Fallback if no RPC exists, try direct update on 'auth.users' assuming RLS allows it
    // (though usually denied by default, it works if using service role on backend)
    const { error: directError } = await supabase.auth.admin
      .updateUserById(userId, {
        user_metadata: metadataUpdates,
      })
      .catch(() => ({ error: { message: 'Admin API not available on client' } }))

    if (directError && error.code !== '42883') {
      throw new Error(getErrorMessage(error))
    }
  }
}

export const deleteUserById = async (userId: string): Promise<void> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase.rpc('delete_user_rpc', {
    target_user_id: userId,
  })

  if (error) {
    throw new Error(getErrorMessage(error))
  }
}
