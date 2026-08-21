import type { AdminNavItem } from '@/types/admin-sidebar.types'

export const primaryAdminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Map', to: '/admin/map', icon: 'map' },
  { label: 'Report', to: '/admin/reports', icon: 'report' },
  { label: 'Analytics', to: '/admin/analytics', icon: 'analytics' },
]

export const managementAdminNavItems: AdminNavItem[] = [
  { label: 'Users', to: '/admin/users', icon: 'users' },
  { label: 'Roles & Access', to: '/admin/roles', icon: 'roles' },
  { label: 'Notifications', to: '/admin/notifications', icon: 'notifications' },
  { label: 'Settings', to: '/admin/settings', icon: 'settings' },
]
