export type BusinessRole = 'space_owner' | 'entrepreneur' | 'supplier'

export type SiteThemeColor = 'ocean' | 'forest' | 'sunset'
export type SiteLayoutStyle =
  | 'corporate'
  | 'orbit'
  | 'bento'
  | 'signal'
  | 'vine'
  | 'nomade'
export type SiteFontPrimary = 'fraunces' | 'libre_baskerville' | 'playfair'
export type SiteFontSecondary = 'source_sans' | 'dm_sans' | 'nunito'
export type SiteFontTertiary = 'jetbrains_mono' | 'ibm_plex_mono' | 'space_mono'
export type SiteSectionKey = 'hero' | 'about' | 'services' | 'gallery' | 'contact'

export const BUSINESS_ROLE_OPTIONS: { value: BusinessRole; label: string }[] = [
  { value: 'space_owner', label: 'Space Owner' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'supplier', label: 'Supplier' },
]

export const SITE_THEME_OPTIONS: { value: SiteThemeColor; label: string }[] = [
  { value: 'ocean', label: 'Ocean — cool blues' },
  { value: 'forest', label: 'Forest — earthy greens' },
  { value: 'sunset', label: 'Sunset — warm hospitality' },
]

export const SITE_LAYOUT_OPTIONS: { value: SiteLayoutStyle; label: string }[] = [
  { value: 'corporate', label: 'Nourish Shop' },
  { value: 'orbit', label: 'Orbit Showcase' },
  { value: 'bento', label: 'Bento Dark' },
  { value: 'signal', label: 'Signal Bold' },
  { value: 'vine', label: 'Vine Studio' },
  { value: 'nomade', label: 'Nomad Immersive' },
]

export const SITE_FONT_PRIMARY_OPTIONS: { value: SiteFontPrimary; label: string }[] = [
  { value: 'fraunces', label: 'Fraunces' },
  { value: 'libre_baskerville', label: 'Libre Baskerville' },
  { value: 'playfair', label: 'Playfair Display' },
]

export const SITE_FONT_SECONDARY_OPTIONS: { value: SiteFontSecondary; label: string }[] = [
  { value: 'source_sans', label: 'Source Sans 3' },
  { value: 'dm_sans', label: 'DM Sans' },
  { value: 'nunito', label: 'Nunito' },
]

export const SITE_FONT_TERTIARY_OPTIONS: { value: SiteFontTertiary; label: string }[] = [
  { value: 'jetbrains_mono', label: 'JetBrains Mono' },
  { value: 'ibm_plex_mono', label: 'IBM Plex Mono' },
  { value: 'space_mono', label: 'Space Mono' },
]

export const DEFAULT_SITE_SECTIONS: {
  section_key: SiteSectionKey
  title: string
  body: string
  sort_order: number
}[] = [
  {
    section_key: 'hero',
    title: 'Welcome',
    body: 'Tell visitors what makes your place or business special.',
    sort_order: 0,
  },
  {
    section_key: 'about',
    title: 'About',
    body: 'Share your story, mission, and what you offer.',
    sort_order: 1,
  },
  {
    section_key: 'services',
    title: 'Services',
    body: 'List your spaces, products, or services.',
    sort_order: 2,
  },
  {
    section_key: 'gallery',
    title: 'Gallery',
    body: 'Highlight photos of your location.',
    sort_order: 3,
  },
  {
    section_key: 'contact',
    title: 'Contact Us',
    body: 'Send us a message and we will get back to you.',
    sort_order: 4,
  },
]

export interface PinnedLocationImage {
  url: string
  alt?: string
}

export interface PinnedLocation {
  id: string
  user_id: string
  role: BusinessRole
  title: string
  description: string
  latitude: number
  longitude: number
  website_url: string | null
  theme_color: SiteThemeColor
  layout_style: SiteLayoutStyle
  font_primary: SiteFontPrimary
  font_secondary: SiteFontSecondary
  font_tertiary: SiteFontTertiary
  /** Website cover / hero images (My Site designer) — not shown on the map pin card */
  images: PinnedLocationImage[]
  /** Photos shown when someone clicks the map pin — not used on the public website */
  map_images: PinnedLocationImage[]
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface SiteSection {
  id: string
  pinned_location_id: string
  section_key: SiteSectionKey
  title: string
  body: string
  sort_order: number
  images: PinnedLocationImage[]
  created_at: string
  updated_at: string
}

export interface ContactMessage {
  id: string
  pinned_location_id: string
  sender_name: string
  sender_email: string
  message: string
  is_read: boolean
  created_at: string
}

export interface CreatePinnedLocationInput {
  role: BusinessRole
  title: string
  description: string
  latitude: number
  longitude: number
}

export interface UpdatePinnedLocationInput {
  title?: string
  description?: string
  latitude?: number
  longitude?: number
  website_url?: string | null
  theme_color?: SiteThemeColor
  layout_style?: SiteLayoutStyle
  font_primary?: SiteFontPrimary
  font_secondary?: SiteFontSecondary
  font_tertiary?: SiteFontTertiary
  images?: PinnedLocationImage[]
  map_images?: PinnedLocationImage[]
  is_published?: boolean
}

export interface UpsertSiteSectionInput {
  section_key: SiteSectionKey
  title: string
  body: string
  sort_order: number
  images?: PinnedLocationImage[]
}

export interface CreateContactMessageInput {
  pinned_location_id: string
  sender_name: string
  sender_email: string
  message: string
}

export interface MapPinMarker {
  id: string
  lat: number
  lng: number
  title: string
  role: BusinessRole
}
