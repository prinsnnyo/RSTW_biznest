import type { BusinessRole } from '@/types/pinned-location.types'

export type BusinessApplicationStatus = 'pending' | 'approved' | 'rejected'

export type BusinessDocumentKind = 'valid_id' | 'business_permit' | 'dti_sec' | 'other'

export interface BusinessApplicationDocument {
  id: string
  application_id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  document_kind: BusinessDocumentKind
  created_at: string
  signed_url?: string
}

export interface BusinessRoleApplication {
  id: string
  user_id: string
  requested_role: BusinessRole
  status: BusinessApplicationStatus
  business_name: string
  business_address: string
  business_description: string
  contact_phone: string
  registration_number: string | null
  tin: string | null
  review_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  documents?: BusinessApplicationDocument[]
}

export interface SubmitBusinessApplicationInput {
  requested_role: BusinessRole
  business_name: string
  business_address: string
  business_description: string
  contact_phone: string
  registration_number?: string
  tin?: string
  documents: Array<{
    file: File
    kind: BusinessDocumentKind
  }>
}

export const DOCUMENT_KIND_OPTIONS: { value: BusinessDocumentKind; label: string }[] = [
  { value: 'valid_id', label: 'Valid government ID' },
  { value: 'business_permit', label: "Mayor's / business permit" },
  { value: 'dti_sec', label: 'DTI or SEC registration' },
  { value: 'other', label: 'Other supporting document' },
]
