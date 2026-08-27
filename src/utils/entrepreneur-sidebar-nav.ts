import type { AdminNavItem } from '@/types/admin-sidebar.types'

export const primaryEntrepreneurNavItems: AdminNavItem[] = [
  { label: 'Map', to: '/app/map', icon: 'map' },
  { label: 'Suitability Analysis', to: '/app/suitability-analysis', icon: 'analytics' },
  { label: 'Home', to: '/app/home', icon: 'dashboard' },
  { label: 'My Site', to: '/app/my-site', icon: 'settings' },
  { label: 'Messages', to: '/app/messages', icon: 'notifications' },
]
