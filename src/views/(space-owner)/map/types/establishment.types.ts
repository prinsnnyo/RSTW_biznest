/** Form payload for the space-owner pin modal. */
export interface EstablishmentDraft {
  name: string
  address: string
  contactNumber: string
  description: string
}

/** A pinned establishment: the draft plus the map point it was dropped on. */
export interface Establishment extends EstablishmentDraft {
  id: string
  lat: number
  lng: number
}
