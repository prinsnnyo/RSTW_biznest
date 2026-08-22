import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import LandingView from '@/views/landing/LandingView.vue'

//Layouts
import OuterLayout from '@/layouts/OuterLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import InnerLayout from '@/layouts/InnerLayout.vue'
import UserLayout from '@/layouts/UserLayout.vue'

//Auth Routes
import LoginView from '@/views/auth/login/LoginView.vue'
import RegisterView from '@/views/auth/register/RegisterView.vue'

//Admin Routes
import DashboardView from '@/views/(admin)/dashboard/DashboardView.vue'
import AdminMap from '@/views/(admin)/map/AdminMap.vue'
import UsersView from '@/views/(admin)/users/UsersView.vue'
import ReportsView from '@/views/(admin)/reports/ReportsView.vue'
import RolesView from '@/views/(admin)/roles/RolesView.vue'

// User app
import UserHomeView from '@/views/(user)/home/UserHomeView.vue'
import UserMapView from '@/views/(user)/map/UserMapView.vue'
import SiteBuilderView from '@/views/(user)/site-builder/SiteBuilderView.vue'
import MessagesView from '@/views/(user)/messages/MessagesView.vue'
import SpaceOwnerHomeView from '@/views/(user)/roles/SpaceOwnerHomeView.vue'
import EntrepreneurHomeView from '@/views/(user)/roles/EntrepreneurHomeView.vue'
import SupplierHomeView from '@/views/(user)/roles/SupplierHomeView.vue'
import SiteView from '@/views/sites/SiteView.vue'

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
      path: '/sites/:id',
      name: 'public-site',
      component: SiteView,
    },
    {
      path: '/login',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: LoginView,
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
          redirect: { name: 'login' },
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
      path: '/app',
      component: UserLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: { name: 'user-home' },
        },
        {
          path: 'home',
          name: 'user-home',
          component: UserHomeView,
          meta: { requiresAuth: true },
        },
        {
          path: 'map',
          name: 'user-map',
          component: UserMapView,
          meta: { requiresAuth: true },
        },
        {
          path: 'my-site',
          name: 'user-site-builder',
          component: SiteBuilderView,
          meta: { requiresAuth: true, requiresBusiness: true },
        },
        {
          path: 'messages',
          name: 'user-messages',
          component: MessagesView,
          meta: { requiresAuth: true, requiresBusiness: true },
        },
        {
          path: 'space-owner',
          name: 'space-owner-home',
          component: SpaceOwnerHomeView,
          meta: { requiresAuth: true, requiresBusiness: true },
        },
        {
          path: 'entrepreneur',
          name: 'entrepreneur-home',
          component: EntrepreneurHomeView,
          meta: { requiresAuth: true, requiresBusiness: true },
        },
        {
          path: 'supplier',
          name: 'supplier-home',
          component: SupplierHomeView,
          meta: { requiresAuth: true, requiresBusiness: true },
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

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.isInitialized) {
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

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    return { name: authStore.homeRouteName }
  }

  if (to.meta.requiresSuperadmin && !authStore.isSuperAdmin) {
    return { name: authStore.homeRouteName }
  }

  if (to.meta.requiresBusiness && !authStore.isBusinessUser) {
    return { name: 'user-home' }
  }

  return true
})

export default router
