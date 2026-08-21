import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/services/supabase.client'
import type { BusinessRole } from '@/types/pinned-location.types'

const BUSINESS_ROLES: BusinessRole[] = ['space_owner', 'entrepreneur', 'supplier']

const parseBusinessRole = (value: unknown): BusinessRole | null => {
  if (typeof value !== 'string') {
    return null
  }
  return BUSINESS_ROLES.includes(value as BusinessRole) ? (value as BusinessRole) : null
}

export const useAuthStore = defineStore('auth', () => {
  // 1. State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isInitialized = ref(false) // Helps prevent flashing unprotected routes on load

  // 2. Getters
  const isLoggedIn = computed(() => !!session.value)
  const isSuperAdmin = computed(() => user.value?.user_metadata?.role === 'superadmin')
  const isAdmin = computed(() => {
    const role = user.value?.user_metadata?.role
    return role === 'admin' || role === 'superadmin'
  })
  const businessRole = computed(() => parseBusinessRole(user.value?.user_metadata?.business_role))
  const isBusinessUser = computed(() => businessRole.value !== null)
  const homeRouteName = computed(() => (isAdmin.value ? 'admin-map' : 'user-map'))

  // 3. Actions
  const initializeAuthListener = () => {
    const supabase = getSupabaseClient()

    // Fetch the initial session (crucial for when the user hard-refreshes the page)
    supabase.auth.getSession().then(({ data }) => {
      session.value = data.session
      user.value = data.session?.user ?? null
      isInitialized.value = true
    })

    // Listen for all future auth events (login, logout, token refresh)
    supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Supabase Auth Event:', event)
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  const logout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    // Note: We don't need to manually clear 'user' or 'session' here
    // because the onAuthStateChange listener above will catch the 'SIGNED_OUT' event and clear them automatically!
  }

  return {
    user,
    session,
    isInitialized,
    isLoggedIn,
    isSuperAdmin,
    isAdmin,
    businessRole,
    isBusinessUser,
    homeRouteName,
    initializeAuthListener,
    logout,
  }
})
