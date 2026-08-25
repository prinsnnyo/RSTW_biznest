import type { MapSpacePreset } from '@/types/map.types'

export interface StarPoint {
  x: number
  y: number
  radius: number
  opacity: number
}

export interface GlobeScreenGeometry {
  center: { x: number; y: number }
  radius: number
}

export interface GlobeSpaceOverlayOptions {
  preset: MapSpacePreset
  haloColor: string
  haloOpacity: number
  haloScale: number
  globe: GlobeScreenGeometry | null
  stars: StarPoint[]
}

export const SPACE_PRESET_STAR_DENSITY: Record<MapSpacePreset, number> = {
  none: 0,
  space: 0,
  stars: 1,
  'milky-way': 1,
  'subtle-milky-way': 0.6,
  'bright-milky-way': 1.6,
  'colored-milky-way': 1.2,
}

// Seeded PRNG so the starfield is stable across redraws — a fresh
// `Math.random()` per frame would make the sky visibly shimmer.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateStarField(width: number, height: number, density: number): StarPoint[] {
  if (density <= 0 || width <= 0 || height <= 0) {
    return []
  }

  const count = Math.round(((width * height) / 9000) * density)
  const random = mulberry32(Math.round(width * 31 + height * 17) || 1)
  const stars: StarPoint[] = []

  for (let i = 0; i < count; i++) {
    stars.push({
      x: random() * width,
      y: random() * height,
      radius: 0.4 + random() * 1.1,
      opacity: 0.35 + random() * 0.65,
    })
  }

  return stars
}

const SPACE_BACKGROUND: Record<MapSpacePreset, string | null> = {
  none: null,
  space: '#05070d',
  stars: '#05070d',
  'milky-way': '#070912',
  'subtle-milky-way': '#0a0d16',
  'bright-milky-way': '#05060f',
  'colored-milky-way': '#0a0716',
}

const MILKY_WAY_BANDS: Partial<Record<MapSpacePreset, string[]>> = {
  'milky-way': ['rgba(210,220,255,0)', 'rgba(210,220,255,0.22)', 'rgba(210,220,255,0)'],
  'subtle-milky-way': ['rgba(200,210,255,0)', 'rgba(200,210,255,0.1)', 'rgba(200,210,255,0)'],
  'bright-milky-way': ['rgba(220,230,255,0)', 'rgba(220,230,255,0.4)', 'rgba(220,230,255,0)'],
  'colored-milky-way': [
    'rgba(120,90,255,0)',
    'rgba(160,120,255,0.32)',
    'rgba(255,140,200,0.18)',
    'rgba(120,90,255,0)',
  ],
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized
  const value = parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Draws the "Space" backdrop (starfield/milky-way presets) and the globe
 * "Halo" glow onto a canvas laid on top of the MapLibre canvas, punching a
 * transparent hole exactly over the rendered globe so the real map is never
 * obscured. Caller is responsible for only invoking this in globe projection.
 */
export function drawGlobeSpaceOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: GlobeSpaceOverlayOptions,
): void {
  ctx.clearRect(0, 0, width, height)

  const hasBackground = options.preset !== 'none'
  const hasHalo = options.globe !== null && options.haloOpacity > 0
  if (!hasBackground && !hasHalo) {
    return
  }

  const background = SPACE_BACKGROUND[options.preset]
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
  }

  const bandColors = MILKY_WAY_BANDS[options.preset]
  if (bandColors) {
    const diagonal = Math.hypot(width, height)
    const gradient = ctx.createLinearGradient(0, height * 0.15, width, height * 0.85)
    bandColors.forEach((color, index) => gradient.addColorStop(index / (bandColors.length - 1), color))

    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate(-Math.PI / 8)
    ctx.translate(-width / 2, -height / 2)
    ctx.fillStyle = gradient
    ctx.fillRect(-diagonal, -diagonal, diagonal * 2 + width, diagonal * 2 + height)
    ctx.restore()
  }

  if (options.preset !== 'none' && options.preset !== 'space') {
    ctx.fillStyle = '#ffffff'
    options.stars.forEach((star) => {
      ctx.globalAlpha = star.opacity
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
  }

  if (hasHalo && options.globe) {
    const { center, radius } = options.globe
    const outerRadius = radius * Math.max(options.haloScale, 1)
    const gradient = ctx.createRadialGradient(
      center.x,
      center.y,
      radius * 0.92,
      center.x,
      center.y,
      outerRadius,
    )
    gradient.addColorStop(0, hexToRgba(options.haloColor, options.haloOpacity))
    gradient.addColorStop(1, hexToRgba(options.haloColor, 0))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  if (options.globe) {
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(options.globe.center.x, options.globe.center.y, options.globe.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
