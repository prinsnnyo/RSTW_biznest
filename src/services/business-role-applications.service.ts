import { getSupabaseClient } from '@/services/supabase.client'
import type { BusinessRole } from '@/types/pinned-location.types'
import type {
  BusinessDocumentKind,
  BusinessRoleApplication,
  BusinessApplicationDocument,
  SubmitBusinessApplicationInput,
} from '@/types/business-role-application.types'

const APPLICATIONS_TABLE = 'business_role_applications'
const DOCUMENTS_TABLE = 'business_role_application_documents'
const BUCKET = 'business-applications'
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

const sanitizeFileName = (name: string): string => name.replace(/[^\w.\-]+/g, '_').slice(0, 80)

export const listMyBusinessApplications = async (): Promise<BusinessRoleApplication[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(APPLICATIONS_TABLE)
    .select('*, documents:business_role_application_documents(*)')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as BusinessRoleApplication[]
}

export const listBusinessApplicationsForAdmin = async (): Promise<BusinessRoleApplication[]> => {
  return listMyBusinessApplications()
}

export const createSignedDocumentUrl = async (storagePath: string): Promise<string> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Unable to open this document.')
  }

  return data.signedUrl
}

export const submitBusinessRoleApplication = async (
  input: SubmitBusinessApplicationInput,
): Promise<BusinessRoleApplication> => {
  if (input.documents.length === 0) {
    throw new Error('Upload at least one legal document for review.')
  }

  for (const item of input.documents) {
    if (item.file.size > MAX_FILE_BYTES) {
      throw new Error(`${item.file.name} is larger than 10 MB.`)
    }
    if (item.file.type && !ALLOWED_TYPES.has(item.file.type)) {
      throw new Error(`${item.file.name} must be a PDF, JPG, PNG, or WebP file.`)
    }
  }

  const supabase = getSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to apply.')
  }

  const { data: application, error: insertError } = await supabase
    .from(APPLICATIONS_TABLE)
    .insert({
      user_id: user.id,
      requested_role: input.requested_role,
      business_name: input.business_name.trim(),
      business_address: input.business_address.trim(),
      business_description: input.business_description.trim(),
      contact_phone: input.contact_phone.trim(),
      registration_number: input.registration_number?.trim() || null,
      tin: input.tin?.trim() || null,
      status: 'pending',
    })
    .select('*')
    .single()

  if (insertError || !application) {
    if (insertError?.message.toLowerCase().includes('duplicate')) {
      throw new Error(
        'You already have a pending application. Wait for the super admin to review it.',
      )
    }
    throw new Error(insertError?.message ?? 'Unable to submit the application.')
  }

  const uploadedDocs: BusinessApplicationDocument[] = []

  try {
    for (const item of input.documents) {
      const path = `${user.id}/${application.id}/${Date.now()}-${sanitizeFileName(item.file.name)}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, item.file, {
        cacheControl: '3600',
        upsert: false,
        contentType: item.file.type || 'application/octet-stream',
      })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data: docRow, error: docError } = await supabase
        .from(DOCUMENTS_TABLE)
        .insert({
          application_id: application.id,
          storage_path: path,
          file_name: item.file.name,
          mime_type: item.file.type || null,
          document_kind: item.kind,
        })
        .select('*')
        .single()

      if (docError || !docRow) {
        throw new Error(docError?.message ?? 'Document metadata could not be saved.')
      }

      uploadedDocs.push(docRow as BusinessApplicationDocument)
    }
  } catch (error) {
    await supabase.from(APPLICATIONS_TABLE).delete().eq('id', application.id)
    throw new Error(getErrorMessage(error, 'Document upload failed. Please try again.'))
  }

  return {
    ...(application as BusinessRoleApplication),
    documents: uploadedDocs,
  }
}

export const reviewBusinessRoleApplication = async (
  applicationId: string,
  decision: 'approved' | 'rejected',
  notes?: string,
): Promise<BusinessRoleApplication> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('review_business_role_application', {
    p_application_id: applicationId,
    p_decision: decision,
    p_notes: notes ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as BusinessRoleApplication
}

export const roleLabel = (role: BusinessRole): string => {
  if (role === 'space_owner') return 'Space Owner'
  if (role === 'entrepreneur') return 'Entrepreneur'
  return 'Supplier'
}

export const documentKindLabel = (kind: BusinessDocumentKind): string => {
  if (kind === 'valid_id') return 'Valid ID'
  if (kind === 'business_permit') return "Mayor's permit"
  if (kind === 'dti_sec') return 'DTI / SEC'
  return 'Other'
}
