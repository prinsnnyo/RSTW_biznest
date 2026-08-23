import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import LandingView from '@/views/landing/LandingView.vue'

//Layouts
import OuterLayout from '@/layouts/OuterLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import InnerLayout from '@/layouts/InnerLayout.vue'
import EntrepreneurLayout from '@/layouts/EntrepreneurLayout.vue'
import UserSidebar from '@/components/UserSidebar.vue'
import SpaceOwnerSidebar from '@/components/SpaceOwnerSidebar.vue'
import SpaceOwnerMapView from '@/views/(space-owner)/map/SpaceOwnerMapView.vue'
import UserMapView from '@/views/(user)/map/UserMapView.vue'

//Auth Routes
import LoginView from '@/views/auth/login/LoginView.vue'
import RegisterView from '@/views/auth/register/RegisterView.vue'

//Admin Routes
import DashboardView from '@/views/(admin)/dashboard/DashboardView.vue'
import AdminMap from '@/views/(admin)/map/AdminMap.vue'
import UsersView from '@/views/(admin)/users/UsersView.vue'
import ReportsView from '@/views/(admin)/reports/ReportsView.vue'
import RolesView from '@/views/(admin)/roles/RolesView.vue'

// Entrepreneur app (also used by supplier until it gets its own shell)
import EntrepreneurHomeView from '@/views/(entrepreneur)/home/EntrepreneurHomeView.vue'
import EntrepreneurMapView from '@/views/(entrepreneur)/map/EntrepreneurMapView.vue'
import SiteBuilderView from '@/views/(entrepreneur)/site-builder/SiteBuilderView.vue'
import MessagesView from '@/views/(entrepreneur)/messages/MessagesView.vue'
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
      component: EntrepreneurLayout,
      meta: { requiresAuth: true, requiresBusinessShell: true },
      children: [
        {
          path: '',
          redirect: { name: 'entrepreneur-home' },
        },
        {
          path: 'home',
          name: 'entrepreneur-home',
          component: EntrepreneurHomeView,
          meta: { requiresAuth: true, requiresBusinessShell: true },
        },
        {
          path: 'map',
          name: 'entrepreneur-map',
          component: EntrepreneurMapView,
          meta: { requiresAuth: true, requiresBusinessShell: true },
        },
        {
          path: 'my-site',
          name: 'entrepreneur-site-builder',
          component: SiteBuilderView,
          meta: { requiresAuth: true, requiresBusinessShell: true },
        },
        {
          path: 'messages',
          name: 'entrepreneur-messages',
          component: MessagesView,
          meta: { requiresAuth: true, requiresBusinessShell: true },
        },
      ],
    },
    {
      // Space owners get the normal-user shell, on their own routes so the two
      // can diverge later without touching each other.
      path: '/space-owner',
      component: InnerLayout,
      props: { sidebar: SpaceOwnerSidebar },
      meta: { requiresAuth: true, requiresSpaceOwner: true },
      children: [
        {
          path: '',
          redirect: { name: 'space-owner-map' },
        },
        {
          path: 'map',
          name: 'space-owner-map',
          component: SpaceOwnerMapView,
          meta: { requiresAuth: true, requiresSpaceOwner: true },
        },
      ],
    },
    {
      path: '/user',
      component: InnerLayout,
      props: { sidebar: UserSidebar },
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: { name: 'user-map' },
        },
        {
          path: 'map',
          name: 'user-map',
          component: UserMapView,
          meta: { requiresAuth: true },
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

  if (to.meta.requiresBusinessShell && !authStore.usesBusinessShell) {
    return { name: authStore.homeRouteName }
  }

  if (to.meta.requiresSpaceOwner && !authStore.isSpaceOwner) {
    return { name: authStore.homeRouteName }
  }

  return true
})

export default router
