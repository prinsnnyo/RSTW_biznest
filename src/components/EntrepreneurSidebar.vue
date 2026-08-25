<script setup lang="ts">
import { computed } from 'vue'
import { LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import UserSidebar from '@/components/UserSidebar.vue'
import { Button } from '@/components/ui/button'
import { SidebarFooter } from '@/components/ui/sidebar'
import { TypographySmall } from '@/components/typography'
import { useAuthStore } from '@/stores/auth.store'
import { useAlertContext } from '@/composables/useAlert'
import { primaryEntrepreneurNavItems } from '@/utils/entrepreneur-sidebar-nav'
import type { AdminNavItem } from '@/types/admin-sidebar.types'

const authStore = useAuthStore()
const router = useRouter()
const { showAlert, showSuccess } = useAlertContext()

const navItems = computed<AdminNavItem[]>(() => {
  const items = primaryEntrepreneurNavItems.filter((item) => {
    if (item.to === '/app/my-site') {
      return authStore.isBusinessUser
    }
    return true
  })
  if (!authStore.isBusinessUser) {
    items.push({ label: 'Become a partner', to: '/app/billing', icon: 'users' })
  }
  if (authStore.isAdmin) {
    items.push({ label: 'Admin', to: '/admin/map', icon: 'roles' })
  }
  return items
})

const handleSignOut = async (): Promise<void> => {
  try {
    await authStore.logout()
    showSuccess('You have been signed out from your BizNest account.', {
      title: 'Logged out',
    })
    await router.push('/login')
  } catch (error) {
    showAlert({
      title: 'Logout failed',
      description: error instanceof Error ? error.message : 'Unable to log out right now.',
      tone: 'destructive',
    })
  }
}
</script>

<template>
  <UserSidebar :items="navItems">
    <template #footer>
      <SidebarFooter class="p-2">
        <Button
          variant="ghost"
          class="text-foreground/75 hover:text-foreground h-8 w-full justify-start gap-2 px-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:gap-0"
          @click="handleSignOut"
        >
          <LogOut class="h-4 w-4 shrink-0" />
          <TypographySmall as="span" class="group-data-[collapsible=icon]:hidden text-sm">
            Sign out
          </TypographySmall>
        </Button>
      </SidebarFooter>
    </template>
  </UserSidebar>
</template>
