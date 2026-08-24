import { RENTAL_SPACES } from '@/services/chatbot/chatbot.static-data'
import type { RentalSpace } from '@/types/chatbot.types'
import {
  DEFAULT_SITE_SECTIONS,
  type MapPinMarker,
  type PinnedLocation,
  type SiteSection,
} from '@/types/pinned-location.types'
import { siteLookFromIndex } from '@/utils/site-design'

const nowIso = (): string => new Date().toISOString()

export const isCatalogSpaceId = (id: string): boolean =>
  RENTAL_SPACES.some((space) => space.id === id)

export const getCatalogSpace = (id: string): RentalSpace | undefined =>
  RENTAL_SPACES.find((space) => space.id === id)

export const catalogSpaceToPin = (space: RentalSpace): PinnedLocation => {
  const created = nowIso()
  const look = siteLookFromIndex(RENTAL_SPACES.findIndex((entry) => entry.id === space.id))
  return {
    id: space.id,
    user_id: 'catalog',
    role: 'space_owner',
    title: space.name,
    description: space.description ?? '',
    latitude: space.location.lat,
    longitude: space.location.lng,
    website_url: `/sites/${space.id}`,
    theme_color: look.theme_color,
    layout_style: look.layout_style,
    font_primary: look.font_primary,
    font_secondary: look.font_secondary,
    font_tertiary: look.font_tertiary,
    images: space.imageUrl ? [{ url: space.imageUrl, alt: space.name }] : [],
    map_images: space.imageUrl ? [{ url: space.imageUrl, alt: space.name }] : [],
    is_published: true,
    created_at: created,
    updated_at: created,
  }
}

export const catalogSpaceToMarker = (space: RentalSpace): MapPinMarker => ({
  id: space.id,
  lat: space.location.lat,
  lng: space.location.lng,
  title: space.name,
  role: 'space_owner',
  description: space.description,
  website_url: `/sites/${space.id}`,
})

export const defaultCatalogSections = (space: RentalSpace): SiteSection[] => {
  const created = nowIso()
  return DEFAULT_SITE_SECTIONS.map((section, index) => {
    let body = section.body
    if (section.section_key === 'hero') {
      body = space.description ?? section.body
    }
    if (section.section_key === 'about') {
      body = `${space.description ?? ''} Located at ${space.address}, Brgy. ${space.barangay}.`
    }
    if (section.section_key === 'services') {
      body = `Rentable ${space.spaceType.replace('-', ' ')} space. Suited for: ${space.suitableFor.join(', ')}.`
    }
    if (section.section_key === 'contact') {
      body = space.contactNumber
        ? `Call ${space.contactNumber} or send a message through this page.`
        : section.body
    }

    return {
      id: `${space.id}-${section.section_key}`,
      pinned_location_id: space.id,
      section_key: section.section_key,
      title: section.section_key === 'hero' ? space.name : section.title,
      body,
      sort_order: index,
      images:
        section.section_key === 'gallery' && space.imageUrl
          ? [{ url: space.imageUrl, alt: space.name }]
          : [],
      created_at: created,
      updated_at: created,
    }
  })
}

const metersBetween = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export const mergePublishedWithCatalogPins = (published: PinnedLocation[]): PinnedLocation[] => {
  const extras = RENTAL_SPACES.map(catalogSpaceToPin).filter((catalogPin) => {
    return !published.some((pin) => {
      if (pin.title.trim().toLowerCase() === catalogPin.title.trim().toLowerCase()) {
        return true
      }
      return (
        metersBetween(
          { lat: pin.latitude, lng: pin.longitude },
          { lat: catalogPin.latitude, lng: catalogPin.longitude },
        ) < 40
      )
    })
  })

  return [...published, ...extras]
}
