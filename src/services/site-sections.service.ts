import { getSupabaseClient } from '@/services/supabase.client'
import {
  DEFAULT_SITE_SECTIONS,
  type PinnedLocationImage,
  type SiteSection,
  type UpsertSiteSectionInput,
} from '@/types/pinned-location.types'

const TABLE = 'site_sections'

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
          alt:
            typeof (item as { alt?: unknown }).alt === 'string'
              ? (item as { alt: string }).alt
              : undefined,
        }
      }
      return null
    })
    .filter((item): item is PinnedLocationImage => item !== null)
}

const toSection = (row: Record<string, unknown>): SiteSection => {
  return {
    id: String(row.id),
    pinned_location_id: String(row.pinned_location_id),
    section_key: row.section_key as SiteSection['section_key'],
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    sort_order: Number(row.sort_order ?? 0),
    images: parseImages(row.images),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export const listSiteSections = async (pinnedLocationId: string): Promise<SiteSection[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('pinned_location_id', pinnedLocationId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => toSection(row as Record<string, unknown>))
}

export const ensureDefaultSiteSections = async (
  pinnedLocationId: string,
): Promise<SiteSection[]> => {
  const existing = await listSiteSections(pinnedLocationId)
  if (existing.length > 0) {
    return existing
  }

  const supabase = getSupabaseClient()
  const rows = DEFAULT_SITE_SECTIONS.map((section) => ({
    pinned_location_id: pinnedLocationId,
    section_key: section.section_key,
    title: section.title,
    body: section.body,
    sort_order: section.sort_order,
    images: [],
  }))

  const { data, error } = await supabase.from(TABLE).insert(rows).select('*')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => toSection(row as Record<string, unknown>))
}

export const upsertSiteSections = async (
  pinnedLocationId: string,
  sections: UpsertSiteSectionInput[],
): Promise<SiteSection[]> => {
  const supabase = getSupabaseClient()
  const rows = sections.map((section) => ({
    pinned_location_id: pinnedLocationId,
    section_key: section.section_key,
    title: section.title,
    body: section.body,
    sort_order: section.sort_order,
    images: section.images ?? [],
  }))

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'pinned_location_id,section_key' })
    .select('*')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? [])
    .map((row) => toSection(row as Record<string, unknown>))
    .sort((a, b) => a.sort_order - b.sort_order)
}
