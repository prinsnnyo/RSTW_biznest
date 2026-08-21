import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/services/supabase.client'

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
    initializeAuthListener,
    logout,
  }
})
