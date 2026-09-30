import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import type { BusinessRole } from '@/types/pinned-location.types'

const BUSINESS_ROLES: BusinessRole[] = ['space_owner', 'entrepreneur', 'supplier']
const DEMO_AUTH_STORAGE_KEY = 'biznest_demo_auth'

export type DemoLoginRole =
  | 'user'
  | 'entrepreneur'
  | 'space_owner'
  | 'supplier'
  | 'admin'
  | 'superadmin'

type DemoAuthSnapshot = {
  role: DemoLoginRole
}

type DemoPersona = {
  role: string
  businessRole: BusinessRole | null
  username: string
  email: string
}

const DEMO_PERSONAS: Record<DemoLoginRole, DemoPersona> = {
  user: {
    role: 'user',
    businessRole: null,
    username: 'Demo User',
    email: 'user@biznest.demo',
  },
  entrepreneur: {
    role: 'user',
    businessRole: 'entrepreneur',
    username: 'Demo Entrepreneur',
    email: 'entrepreneur@biznest.demo',
  },
  space_owner: {
    role: 'user',
    businessRole: 'space_owner',
    username: 'Demo Space Owner',
    email: 'space-owner@biznest.demo',
  },
  supplier: {
    role: 'user',
    businessRole: 'supplier',
    username: 'Demo Supplier',
    email: 'supplier@biznest.demo',
  },
  admin: {
    role: 'admin',
    businessRole: null,
    username: 'Demo Admin',
    email: 'admin@biznest.demo',
  },
  superadmin: {
    role: 'superadmin',
    businessRole: null,
    username: 'Demo Super Admin',
    email: 'superadmin@biznest.demo',
  },
}

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

const createDemoUser = (loginRole: DemoLoginRole): User => {
  const persona = DEMO_PERSONAS[loginRole]
  const now = new Date().toISOString()

  return {
    id: `demo-${loginRole}`,
    aud: 'authenticated',
    role: 'authenticated',
    email: persona.email,
    email_confirmed_at: now,
    phone: '',
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: 'demo', providers: ['demo'] },
    user_metadata: {
      role: persona.role,
      business_role: persona.businessRole ?? '',
      username: persona.username,
      city_name: 'Butuan City',
      city_id: 'demo-city',
    },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  } as User
}

const createDemoSession = (loginRole: DemoLoginRole): Session => {
  const demoUser = createDemoUser(loginRole)

  return {
    access_token: `demo-access-${loginRole}`,
    refresh_token: `demo-refresh-${loginRole}`,
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    token_type: 'bearer',
    user: demoUser,
  } as Session
}

const readStoredDemoRole = (): DemoLoginRole | null => {
  try {
    const raw = localStorage.getItem(DEMO_AUTH_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as DemoAuthSnapshot
    if (parsed.role && parsed.role in DEMO_PERSONAS) {
      return parsed.role
    }
  } catch {
    // Ignore corrupt local storage and fall back to a logged-out state.
  }

  return null
}

const persistDemoRole = (role: DemoLoginRole | null): void => {
  if (!role) {
    localStorage.removeItem(DEMO_AUTH_STORAGE_KEY)
    return
  }

  const snapshot: DemoAuthSnapshot = { role }
  localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(snapshot))
}

export const useAuthStore = defineStore('auth', () => {
  // 1. State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isInitialized = ref(false) // Helps prevent flashing unprotected routes on load
  const activeDemoRole = ref<DemoLoginRole | null>(null)

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
  const isSpaceOwner = computed(() => businessRole.value === 'space_owner')
  // Non-admin accounts share Map / Home / My Site / Messages under /app.
  const usesBusinessShell = computed(() => isLoggedIn.value && !isAdmin.value)
  const homeRouteName = computed(() => (isAdmin.value ? 'admin-map' : 'entrepreneur-map'))

  const applyDemoSession = (role: DemoLoginRole): void => {
    const nextSession = createDemoSession(role)
    session.value = nextSession
    user.value = nextSession.user
    activeDemoRole.value = role
    persistDemoRole(role)
  }

  // 3. Actions
  const initializeAuthListener = () => {
    // Local demo auth only — skip Supabase so login works while the project is paused.
    const storedRole = readStoredDemoRole()
    if (storedRole) {
      applyDemoSession(storedRole)
    } else {
      session.value = null
      user.value = null
      activeDemoRole.value = null
    }
    isInitialized.value = true
  }

  const loginAsRole = async (role: DemoLoginRole): Promise<void> => {
    applyDemoSession(role)
  }

  const logout = async () => {
    session.value = null
    user.value = null
    activeDemoRole.value = null
    persistDemoRole(null)
  }

  return {
    user,
    session,
    isInitialized,
    activeDemoRole,
    isLoggedIn,
    isSuperAdmin,
    isAdmin,
    businessRole,
    isBusinessUser,
    isSpaceOwner,
    usesBusinessShell,
    homeRouteName,
    initializeAuthListener,
    loginAsRole,
    logout,
  }
})
