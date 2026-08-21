import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import LandingView from '@/views/landing/LandingView.vue'

//Layouts
import OuterLayout from '@/layouts/OuterLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import InnerLayout from '@/layouts/InnerLayout.vue'

//Auth Routes
import LoginView from '@/views/auth/login/LoginView.vue'
import RegisterView from '@/views/auth/register/RegisterView.vue'

//Admin Routes
import DashboardView from '@/views/(admin)/dashboard/DashboardView.vue'
import AdminMap from '@/views/(admin)/map/AdminMap.vue'
import UsersView from '@/views/(admin)/users/UsersView.vue'
import ReportsView from '@/views/(admin)/reports/ReportsView.vue'
import RolesView from '@/views/(admin)/roles/RolesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: OuterLayout,
      children: [
        {
          path: '',
          name: 'landing',
          component: LandingView,
          meta: { requiresGuest: true },
        },
        {
          path: 'about',
          name: 'about',
          component: LandingView,
          meta: { requiresGuest: true },
        },
      ],
    },
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: LoginView,
          meta: { requiresGuest: true },
        },
        {
          path: 'register',
          name: 'register',
          component: RegisterView,
          meta: { requiresGuest: true },
        },
      ],
    },
    {
      path: '/admin',
      component: InnerLayout,
      children: [
        {
          path: '',
          redirect: { name: 'admin-map' },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { requiresAuth: true },
        },
        {
          path: 'map',
          name: 'admin-map',
          component: AdminMap,
          meta: { requiresAuth: true },
        },
        {
          path: 'reports',
          name: 'reports',
          component: ReportsView,
          meta: { requiresAuth: true },
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { requiresAuth: true, requiresSuperadmin: true },
        },
        {
          path: 'roles',
          name: 'roles',
          component: RolesView,
          meta: { requiresAuth: true, requiresSuperadmin: true },
        },
      ],
    },
  ],
})

// 3. Set up the Navigation Guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for Supabase to finish checking the initial session on page load
  if (!authStore.isInitialized) {
    // We wait for a tiny fraction of a second for the async getSession to finish
    await new Promise((resolve) => {
      const unwatch = authStore.$subscribe((_mutation, state) => {
        if (state.isInitialized) {
          unwatch()
          resolve(true)
        }
      })
    })
  }

  const isAuthenticated = authStore.isLoggedIn

  // If the route requires auth and the user is NOT logged in -> send to login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }
  // If the route requires them to be a guest (like the login page) and they ARE logged in -> send to map
  else if (to.meta.requiresGuest && isAuthenticated) {
    return { name: 'admin-map' }
  }
  // If the route requires superadmin and user does not have superadmin role -> send to map
  else if (to.meta.requiresSuperadmin && !authStore.isSuperAdmin) {
    return { name: 'admin-map' }
  }
  // Otherwise, let them proceed normally
  return true
})

export default router
