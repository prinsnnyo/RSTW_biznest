import { getSupabaseClient } from '@/services/supabase.client'

const BUCKET = 'hazard-uploads'

const sanitizeFileName = (name: string): string => name.replace(/[^\w.-]+/g, '_').slice(0, 80)

const uploadHazardFile = async (file: File, folder: string): Promise<string> => {
  const supabase = getSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to upload hazard files.')
  }

  const path = `${folder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitizeFileName(file.name)}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return data.publicUrl
}

export const uploadHazardImage = (file: File): Promise<string> => uploadHazardFile(file, 'images')

export const uploadHazardAttachment = (file: File): Promise<string> =>
  uploadHazardFile(file, 'attachments')

export const uploadHazardPmtiles = (file: File): Promise<string> =>
  uploadHazardFile(file, 'pmtiles')
