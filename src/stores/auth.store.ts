import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/services/supabase.client'
import type { BusinessRole } from '@/types/pinned-location.types'

const BUSINESS_ROLES: BusinessRole[] = ['space_owner', 'entrepreneur', 'supplier']

// Role titles are authored by hand in the `roles` table, so "Space Owner",
// "space-owner" and "space_owner" all have to resolve to the same key.
const toRoleKey = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

const parseBusinessRole = (value: unknown): BusinessRole | null => {
  const key = toRoleKey(value)
  return BUSINESS_ROLES.includes(key as BusinessRole) ? (key as BusinessRole) : null
}

export const useAuthStore = defineStore('auth', () => {
  // 1. State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isInitialized = ref(false) // Helps prevent flashing unprotected routes on load

  // 2. Getters
  const isLoggedIn = computed(() => !!session.value)
  // Separators are dropped here so "Super Admin" and "superadmin" match.
  const compactRoleKey = computed(() =>
    toRoleKey(user.value?.user_metadata?.role).replace(/_/g, ''),
  )
  const isSuperAdmin = computed(() => compactRoleKey.value === 'superadmin')
  const isAdmin = computed(
    () => compactRoleKey.value === 'admin' || compactRoleKey.value === 'superadmin',
  )
  // Users Management edits `role` only, so it doubles as a source for the
  // business role that registration writes to `business_role`.
  const businessRole = computed(
    () =>
      parseBusinessRole(user.value?.user_metadata?.business_role) ??
      parseBusinessRole(user.value?.user_metadata?.role),
  )
  const isBusinessUser = computed(() => businessRole.value !== null)
  // Space owners run the normal-user shell; entrepreneurs and suppliers share
  // the business shell under /app.
  const isSpaceOwner = computed(() => businessRole.value === 'space_owner')
  const usesBusinessShell = computed(() => isBusinessUser.value && !isSpaceOwner.value)
  const homeRouteName = computed(() => {
    if (isAdmin.value) {
      return 'admin-map'
    }
    if (isSpaceOwner.value) {
      return 'space-owner-map'
    }
    return usesBusinessShell.value ? 'entrepreneur-map' : 'user-map'
  })

  // 3. Actions
  const initializeAuthListener = () => {
    const supabase = getSupabaseClient()

    // Fetch the initial session (crucial for when the user hard-refreshes the page)
    // Refresh so an approved business_role in user metadata is picked up
    // after a super admin review (JWTs otherwise keep the old claims).
    supabase.auth.refreshSession().finally(() => {
      supabase.auth.getSession().then(({ data }) => {
        session.value = data.session
        user.value = data.session?.user ?? null
        isInitialized.value = true
      })
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
    isSpaceOwner,
    usesBusinessShell,
    homeRouteName,
    initializeAuthListener,
    logout,
  }
})
