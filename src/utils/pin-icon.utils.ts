export const PIN_BLUE = '#1a73e8'

/**
 * Builds the classic Google Maps teardrop pin (white inner disc + white halo)
 * as an inline SVG data URL so every map engine renders it identically.
 */
export function createPinIconSrc(color: string = PIN_BLUE): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="-2 -2 28 40">` +
    `<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" ` +
    `fill="${color}" stroke="#ffffff" stroke-width="1.5"/>` +
    `<circle cx="12" cy="11.5" r="4.5" fill="#ffffff"/>` +
    `</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
