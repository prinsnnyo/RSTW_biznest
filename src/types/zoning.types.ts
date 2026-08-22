export interface ZoningLayer {
  id: string
  title: string
  color: string
  description: string | null
  year: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateZoningLayerInput {
  title: string
  color: string
  description: string
  year: number
}

export interface UpdateZoningLayerInput {
  title: string
  color: string
  description: string
  year: number
}

export interface MapDrawPoint {
  lat: number
  lng: number
}

export interface MappedZone {
  id: string
  zoning_layer_id: string
  zoning_title: string
  zoning_color: string
  name: string
  description: string | null
  is_visible: boolean
  points: MapDrawPoint[]
  created_at: string
  updated_at: string
}

export interface MappedZoneRpcRow {
  id: string
  zoning_layer_id: string
  zoning_title: string
  zoning_color: string
  name: string
  description: string | null
  is_visible: boolean
  geometry: {
    type?: string
    coordinates?: unknown
  } | null
  created_at: string
  updated_at: string
}

export interface CreateMappedZoneInput {
  zoningLayerId: string
  name: string
  description: string
  points: MapDrawPoint[]
}

export interface UpdateMappedZoneInput {
  zoningLayerId: string
  name: string
  description: string
  points?: MapDrawPoint[]
}
