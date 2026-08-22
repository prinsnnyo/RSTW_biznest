import { getSupabaseClient } from '@/services/supabase.client'
import type {
  CreatePinnedLocationInput,
  PinnedLocation,
  PinnedLocationImage,
  UpdatePinnedLocationInput,
} from '@/types/pinned-location.types'

const TABLE = 'pinned_locations'

const parseImages = (value: unknown): PinnedLocationImage[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { url: item }
      }
      if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
        return {
          url: item.url,
          alt: typeof (item as { alt?: unknown }).alt === 'string' ? (item as { alt: string }).alt : undefined,
        }
      }
      return null
    })
    .filter((item): item is PinnedLocationImage => item !== null)
}

const toPinnedLocation = (row: Record<string, unknown>): PinnedLocation => {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    role: row.role as PinnedLocation['role'],
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    website_url: typeof row.website_url === 'string' ? row.website_url : null,
    theme_color: (row.theme_color as PinnedLocation['theme_color']) ?? 'ocean',
    layout_style: (row.layout_style as PinnedLocation['layout_style']) ?? 'corporate',
    font_primary: (row.font_primary as PinnedLocation['font_primary']) ?? 'fraunces',
    font_secondary: (row.font_secondary as PinnedLocation['font_secondary']) ?? 'source_sans',
    font_tertiary: (row.font_tertiary as PinnedLocation['font_tertiary']) ?? 'jetbrains_mono',
    images: parseImages(row.images),
    map_images: parseImages(row.map_images),
    is_published: Boolean(row.is_published),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export const listPublishedPins = async (): Promise<PinnedLocation[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => toPinnedLocation(row as Record<string, unknown>))
}

export const getPinnedLocationById = async (id: string): Promise<PinnedLocation | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return toPinnedLocation(data as Record<string, unknown>)
}

export const getMyPinnedLocation = async (): Promise<PinnedLocation | null> => {
  const supabase = getSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to manage a pinned location.')
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return toPinnedLocation(data as Record<string, unknown>)
}

export const createPinnedLocation = async (
  input: CreatePinnedLocationInput,
): Promise<PinnedLocation> => {
  const supabase = getSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to pin a location.')
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      role: input.role,
      title: input.title.trim(),
      description: input.description.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      is_published: true,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const pin = toPinnedLocation(data as Record<string, unknown>)
  const websiteUrl = `/sites/${pin.id}`

  const { data: updated, error: updateError } = await supabase
    .from(TABLE)
    .update({ website_url: websiteUrl })
    .eq('id', pin.id)
    .select('*')
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  return toPinnedLocation(updated as Record<string, unknown>)
}

export const updatePinnedLocation = async (
  id: string,
  input: UpdatePinnedLocationInput,
): Promise<PinnedLocation> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return toPinnedLocation(data as Record<string, unknown>)
}

export const deletePinnedLocation = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from(TABLE).delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export const listAllPinsForAdmin = async (): Promise<PinnedLocation[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => toPinnedLocation(row as Record<string, unknown>))
}
