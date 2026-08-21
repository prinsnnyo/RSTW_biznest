import { getSupabaseClient } from '@/services/supabase.client'
import type { ContactMessage, CreateContactMessageInput } from '@/types/pinned-location.types'

const TABLE = 'contact_messages'

const toMessage = (row: Record<string, unknown>): ContactMessage => {
  return {
    id: String(row.id),
    pinned_location_id: String(row.pinned_location_id),
    sender_name: String(row.sender_name ?? ''),
    sender_email: String(row.sender_email ?? ''),
    message: String(row.message ?? ''),
    is_read: Boolean(row.is_read),
    created_at: String(row.created_at),
  }
}

export const createContactMessage = async (
  input: CreateContactMessageInput,
): Promise<ContactMessage> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      pinned_location_id: input.pinned_location_id,
      sender_name: input.sender_name.trim(),
      sender_email: input.sender_email.trim(),
      message: input.message.trim(),
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return toMessage(data as Record<string, unknown>)
}

export const listMessagesForPin = async (pinnedLocationId: string): Promise<ContactMessage[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('pinned_location_id', pinnedLocationId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => toMessage(row as Record<string, unknown>))
}

export const listRecentMessagesForAdmin = async (limit = 20): Promise<ContactMessage[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => toMessage(row as Record<string, unknown>))
}

export const markMessageRead = async (id: string, isRead = true): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from(TABLE).update({ is_read: isRead }).eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export const countUnreadMessages = async (): Promise<number> => {
  const supabase = getSupabaseClient()
  const { count, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) {
    throw new Error(error.message)
  }

  return count ?? 0
}
