// Reuses AdminNavItem: the sidebar item shape is identical for both shells.
import type { AdminNavItem } from '@/types/admin-sidebar.types'

export const primaryUserNavItems: AdminNavItem[] = [
  { label: 'Map', to: '/user/map', icon: 'map' },
  { label: 'Reports', to: '/user/reports', icon: 'report' },
]
