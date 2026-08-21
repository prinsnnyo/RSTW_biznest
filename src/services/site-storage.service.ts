import { getSupabaseClient } from '@/services/supabase.client'
import type { PinnedLocationImage } from '@/types/pinned-location.types'

const BUCKET = 'site-images'

export const uploadSiteImage = async (file: File): Promise<PinnedLocationImage> => {
  const supabase = getSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to upload images.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return {
    url: data.publicUrl,
    alt: file.name,
  }
}
