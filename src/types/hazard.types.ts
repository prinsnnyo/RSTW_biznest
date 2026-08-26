export type HazardId = string
export type IsoDateTimeString = string
export type IsoDateString = string
export type Uuid = string

export type HazardSeverity = 'low' | 'moderate' | 'high' | 'critical' | (string & {})
export type HazardStatus =
  | 'reported'
  | 'under_review'
  | 'active'
  | 'mitigated'
  | 'resolved'
  | (string & {})
export type HazardGeometryType =
  | 'point'
  | 'linestring'
  | 'polygon'
  | 'multipoint'
  | 'multilinestring'
  | 'multipolygon'

export type HazardCoordinatesPoint = [number, number]
export type HazardCoordinatesLineString = HazardCoordinatesPoint[]
export type HazardCoordinatesPolygon = HazardCoordinatesPoint[][]
export type HazardCoordinatesMultiPoint = HazardCoordinatesPoint[]
export type HazardCoordinatesMultiLineString = HazardCoordinatesLineString[]
export type HazardCoordinatesMultiPolygon = HazardCoordinatesPolygon[]

export interface HazardPointGeometry {
  type: 'Point'
  coordinates: HazardCoordinatesPoint
}

export interface HazardLineStringGeometry {
  type: 'LineString'
  coordinates: HazardCoordinatesLineString
}

export interface HazardPolygonGeometry {
  type: 'Polygon'
  coordinates: HazardCoordinatesPolygon
}

export interface HazardMultiPointGeometry {
  type: 'MultiPoint'
  coordinates: HazardCoordinatesMultiPoint
}

export interface HazardMultiLineStringGeometry {
  type: 'MultiLineString'
  coordinates: HazardCoordinatesMultiLineString
}

export interface HazardMultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: HazardCoordinatesMultiPolygon
}

export type HazardGeometry =
  | HazardPointGeometry
  | HazardLineStringGeometry
  | HazardPolygonGeometry
  | HazardMultiPointGeometry
  | HazardMultiLineStringGeometry
  | HazardMultiPolygonGeometry

export interface HazardCategory {
  id: Uuid
  name: string
  label: string
  description: string | null
  color: string
  icon: string | null
  is_visible: boolean
  sort_order: number
  is_active: boolean
  created_at: IsoDateTimeString
  updated_at: IsoDateTimeString
}

export interface Hazard {
  id: HazardId
  name: string
  description: string | null
  category_id: Uuid
  category?: HazardCategory
  severity: HazardSeverity
  status: HazardStatus
  city_id: string
  geometry: HazardGeometry
  geometry_type: HazardGeometryType
  location_name: string | null
  address: string | null
  barangay: string | null
  city: string | null
  province: string | null
  region: string | null
  reported_by: Uuid | null
  verified_by: Uuid | null
  verified_at: IsoDateTimeString | null
  images: string[] | null
  attachments: string[] | null
  pmtiles_url: string | null
  hazard_date: IsoDateString | null
  occurred_at: IsoDateTimeString | null
  expires_at: IsoDateTimeString | null
  created_at: IsoDateTimeString
  updated_at: IsoDateTimeString
}

export interface CreateHazardInput {
  name: string
  category_id: Uuid
  geometry?: HazardGeometry
  geometry_type?: HazardGeometryType
  city_id: string
  description?: string | null
  severity?: HazardSeverity
  status?: HazardStatus
  location_name?: string | null
  address?: string | null
  barangay?: string | null
  city?: string | null
  province?: string | null
  region?: string | null
  reported_by?: Uuid | null
  hazard_date?: IsoDateString | null
  occurred_at?: IsoDateTimeString | null
  expires_at?: IsoDateTimeString | null
  images?: string[]
  attachments?: string[]
  pmtiles_url?: string | null
}

export interface UploadHazardFormInput {
  name: string
  category_id: Uuid
  severity: HazardSeverity
  status: HazardStatus
  description?: string | null
  location_name?: string | null
  address?: string | null
  barangay?: string | null
  city?: string | null
  province?: string | null
  region?: string | null
  hazard_date?: IsoDateString | null
  geometry?: HazardGeometry
  geometry_type?: HazardGeometryType
  images: string[]
  attachments: string[]
  pmtiles_url?: string | null
}

export type CreateHazardFormInput = Omit<
  CreateHazardInput,
  'geometry' | 'geometry_type' | 'city_id'
>

export type UpdateHazardInput = Partial<
  Omit<Hazard, 'id' | 'created_at' | 'updated_at' | 'reported_by' | 'verified_by' | 'verified_at'>
>

export interface HazardFilters {
  status?: HazardStatus
  severity?: HazardSeverity
  category_id?: Uuid
  barangay?: string
  city?: string
  city_id?: string
  province?: string
  region?: string
  reported_by?: Uuid
  occurred_from?: IsoDateTimeString
  occurred_to?: IsoDateTimeString
  created_from?: IsoDateTimeString
  created_to?: IsoDateTimeString
}

export type HazardSortField =
  | 'created_at'
  | 'updated_at'
  | 'occurred_at'
  | 'expires_at'
  | 'severity'
  | 'status'

export type SortOrder = 'asc' | 'desc'

export interface HazardListQuery {
  page?: number
  pageSize?: number
  search?: string
  filters?: HazardFilters
  sortBy?: HazardSortField
  sortOrder?: SortOrder
}

export interface HazardListResponse {
  data: Hazard[]
  total: number
}
