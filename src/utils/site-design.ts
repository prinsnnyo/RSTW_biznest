/** Shared visual tokens for published dynamic websites (independent of app light/dark). */

import {
  SITE_FONT_PRIMARY_OPTIONS,
  SITE_FONT_SECONDARY_OPTIONS,
  SITE_FONT_TERTIARY_OPTIONS,
  SITE_LAYOUT_OPTIONS,
  SITE_THEME_OPTIONS,
  type SiteFontPrimary,
  type SiteFontSecondary,
  type SiteFontTertiary,
  type SiteLayoutStyle,
  type SiteThemeColor,
} from '@/types/pinned-location.types'

export const SITE_THEME_PRESETS: Record<
  string,
  { label: string; description: string; bg: string; surface: string; ink: string; accent: string }
> = {
  ocean: {
    label: 'Ocean',
    description: 'Cool blues for coastal and modern brands',
    bg: '#dff3f7',
    surface: '#f7fcfd',
    ink: '#0b3a45',
    accent: '#0e7490',
  },
  forest: {
    label: 'Forest',
    description: 'Earthy greens for local and sustainable brands',
    bg: '#e7f2ea',
    surface: '#f6fbf7',
    ink: '#143528',
    accent: '#1f6f5b',
  },
  sunset: {
    label: 'Sunset',
    description: 'Warm tones for hospitality and retail',
    bg: '#f8ebe1',
    surface: '#fff8f2',
    ink: '#4a2a16',
    accent: '#c2410c',
  },
}

export const SITE_TEMPLATE_PRESETS: Record<
  string,
  { label: string; description: string }
> = {
  corporate: {
    label: 'Nourish Shop',
    description:
      'Soft wellness eCommerce — sage accents, rounded product hero, category chips, shop-style cards',
  },
  orbit: {
    label: 'Orbit Showcase',
    description: 'Ultra-minimal white canvas, gradient brand word, floating product imagery',
  },
  bento: {
    label: 'Bento Dark',
    description: 'Dark sidebar + interlocking bento cards, neon accents, tech-retro grid',
  },
  signal: {
    label: 'Signal Bold',
    description: 'Cream header, forest hero, staggered lime headline pills, photo + widget',
  },
  vine: {
    label: 'Vine Studio',
    description: 'Luxury dark canvas like VineWinner — cream type, spotlight product hero, soft glow',
  },
  nomade: {
    label: 'Nomad Immersive',
    description: 'Full-bleed photo hero, centered brand header, bold overlay type, ghost CTAs',
  },
}

export const SITE_COMPONENT_META: Record<
  string,
  { label: string; hint: string }
> = {
  hero: { label: 'Hero banner', hint: 'Big headline and intro at the top of the page' },
  about: { label: 'About', hint: 'Your story, mission, or space details' },
  services: { label: 'Services / offerings', hint: 'What you sell, rent, or supply' },
  gallery: { label: 'Gallery', hint: 'Photo strip of your place or products' },
  contact: { label: 'Contact form', hint: 'Visitors can message you from the site' },
}

export const SITE_FONT_STACK = '"Poppins", "Segoe UI", sans-serif'

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length] as T
}

/** Stable unique look so each pin's public site is not the same template. */
export function siteLookFromId(id: string): {
  layout_style: SiteLayoutStyle
  theme_color: SiteThemeColor
  font_primary: SiteFontPrimary
  font_secondary: SiteFontSecondary
  font_tertiary: SiteFontTertiary
} {
  const seed = hashString(id)
  return {
    layout_style: pick(
      SITE_LAYOUT_OPTIONS.map((option) => option.value),
      seed,
    ),
    theme_color: pick(
      SITE_THEME_OPTIONS.map((option) => option.value),
      seed >> 3,
    ),
    font_primary: pick(
      SITE_FONT_PRIMARY_OPTIONS.map((option) => option.value),
      seed >> 5,
    ),
    font_secondary: pick(
      SITE_FONT_SECONDARY_OPTIONS.map((option) => option.value),
      seed >> 7,
    ),
    font_tertiary: pick(
      SITE_FONT_TERTIARY_OPTIONS.map((option) => option.value),
      seed >> 9,
    ),
  }
}

export function siteLookFromIndex(index: number): ReturnType<typeof siteLookFromId> {
  const layouts = SITE_LAYOUT_OPTIONS.map((option) => option.value)
  const themes = SITE_THEME_OPTIONS.map((option) => option.value)
  const fontsPrimary = SITE_FONT_PRIMARY_OPTIONS.map((option) => option.value)
  const fontsSecondary = SITE_FONT_SECONDARY_OPTIONS.map((option) => option.value)
  const fontsTertiary = SITE_FONT_TERTIARY_OPTIONS.map((option) => option.value)

  return {
    layout_style: layouts[index % layouts.length] as SiteLayoutStyle,
    theme_color: themes[index % themes.length] as SiteThemeColor,
    font_primary: fontsPrimary[index % fontsPrimary.length] as SiteFontPrimary,
    font_secondary: fontsSecondary[index % fontsSecondary.length] as SiteFontSecondary,
    font_tertiary: fontsTertiary[index % fontsTertiary.length] as SiteFontTertiary,
  }
}


export function siteFontStacks(_pin?: {
  font_primary?: string
  font_secondary?: string
  font_tertiary?: string
}): Record<string, string> {
  return {
    '--site-font-primary': SITE_FONT_STACK,
    '--site-font-secondary': SITE_FONT_STACK,
    '--site-font-tertiary': SITE_FONT_STACK,
  }
}
