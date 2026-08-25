import {
  BUSINESS_ROLE_OPTIONS,
  type MapPinMarker,
  type PinnedLocation,
} from '@/types/pinned-location.types'

export const PIN_POPUP_CLASS = 'pin-place-popup'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function pinSitePath(pin: Pick<MapPinMarker, 'id' | 'website_url'>): string {
  const custom = pin.website_url?.trim()
  if (custom) {
    return custom
  }
  return `/sites/${pin.id}`
}

export function pinRoleLabel(role: MapPinMarker['role']): string {
  return BUSINESS_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
}

export function toMapPinMarker(pin: PinnedLocation): MapPinMarker {
  return {
    id: pin.id,
    lat: pin.latitude,
    lng: pin.longitude,
    title: pin.title,
    role: pin.role,
    description: pin.description,
    website_url: pin.website_url ?? `/sites/${pin.id}`,
  }
}

export function buildPinPopupHtml(pin: MapPinMarker): string {
  const href = escapeHtml(pinSitePath(pin))
  const title = escapeHtml(pin.title)
  const category = escapeHtml(pinRoleLabel(pin.role))
  const description = pin.description?.trim()
    ? `<p class="pin-place-card__desc">${escapeHtml(pin.description.trim())}</p>`
    : ''

  return `
    <div class="pin-place-card">
      <div class="pin-place-card__header">
        <svg class="pin-place-card__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#2563eb" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/>
        </svg>
        <strong class="pin-place-card__title">${title}</strong>
      </div>
      <p class="pin-place-card__category">${category}</p>
      ${description}
      <a class="pin-place-card__cta" href="${href}">
        View Details
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"/>
        </svg>
      </a>
    </div>
  `
}
