import type { PinnedLocation, SiteSection, UpsertSiteSectionInput } from '@/types/pinned-location.types'
import {
  catalogSpaceToPin,
  defaultCatalogSections,
  getCatalogSpace,
  isCatalogSpaceId,
} from '@/utils/catalog-spaces.utils'

interface CatalogSiteRecord {
  pin: PinnedLocation
  sections: SiteSection[]
  lookCustomized?: boolean
}

const storageKey = (id: string): string => `biznest:catalog-site:${id}`

const readRecord = (id: string): CatalogSiteRecord | null => {
  const space = getCatalogSpace(id)
  if (!space) {
    return null
  }

  const fallback: CatalogSiteRecord = {
    pin: catalogSpaceToPin(space),
    sections: defaultCatalogSections(space),
  }

  try {
    const raw = localStorage.getItem(storageKey(id))
    if (!raw) {
      return fallback
    }
    const parsed = JSON.parse(raw) as Partial<CatalogSiteRecord>
    const lookCustomized = Boolean(parsed.lookCustomized)
    return {
      pin: lookCustomized
        ? { ...fallback.pin, ...parsed.pin, id, website_url: `/sites/${id}` }
        : {
            ...fallback.pin,
            ...parsed.pin,
            id,
            website_url: `/sites/${id}`,
            layout_style: fallback.pin.layout_style,
            theme_color: fallback.pin.theme_color,
            font_primary: fallback.pin.font_primary,
            font_secondary: fallback.pin.font_secondary,
            font_tertiary: fallback.pin.font_tertiary,
          },
      sections:
        Array.isArray(parsed.sections) && parsed.sections.length > 0
          ? parsed.sections
          : fallback.sections,
      lookCustomized,
    }
  } catch {
    return fallback
  }
}

const writeRecord = (id: string, record: CatalogSiteRecord): void => {
  localStorage.setItem(storageKey(id), JSON.stringify(record))
}

export const getCatalogPinnedLocation = (id: string): PinnedLocation | null => {
  if (!isCatalogSpaceId(id)) {
    return null
  }
  return readRecord(id)?.pin ?? null
}

export const listCatalogSiteSections = (id: string): SiteSection[] => {
  if (!isCatalogSpaceId(id)) {
    return []
  }
  return readRecord(id)?.sections ?? []
}

export const saveCatalogPinnedLocation = (
  id: string,
  updates: Partial<PinnedLocation>,
): PinnedLocation => {
  const current = readRecord(id)
  if (!current) {
    throw new Error('Unknown listing')
  }
  const pin: PinnedLocation = {
    ...current.pin,
    ...updates,
    id,
    website_url: `/sites/${id}`,
    updated_at: new Date().toISOString(),
  }
  writeRecord(id, {
    ...current,
    pin,
    lookCustomized: true,
  })
  return pin
}

export const saveCatalogSiteSections = (
  id: string,
  sections: UpsertSiteSectionInput[],
): SiteSection[] => {
  const current = readRecord(id)
  if (!current) {
    throw new Error('Unknown listing')
  }
  const now = new Date().toISOString()
  const nextSections: SiteSection[] = sections.map((section, index) => ({
    id: `${id}-${section.section_key}`,
    pinned_location_id: id,
    section_key: section.section_key,
    title: section.title,
    body: section.body,
    sort_order: section.sort_order ?? index,
    images: section.images ?? [],
    created_at: now,
    updated_at: now,
  }))
  writeRecord(id, { ...current, sections: nextSections })
  return nextSections
}
