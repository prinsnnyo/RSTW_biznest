// Reuses AdminNavItem: the sidebar item shape is identical across all shells.
import type { AdminNavItem } from '@/types/admin-sidebar.types'

export const primarySpaceOwnerNavItems: AdminNavItem[] = [
  { label: 'Map', to: '/space-owner/map', icon: 'map' },
]
