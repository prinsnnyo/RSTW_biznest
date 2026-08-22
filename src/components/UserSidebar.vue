<script setup lang="ts">
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Map,
  Settings,
  Shield,
  Users,
} from 'lucide-vue-next'
import { computed, type Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { TypographyLarge, TypographySmall } from '@/components/typography'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth.store'
import type { AdminSidebarIconName } from '@/types/admin-sidebar.types'
import { primaryUserNavItems } from '@/utils/user-sidebar-nav'

const route = useRoute()
const authStore = useAuthStore()

const userDisplayName = computed(() => {
  const metadata = authStore.user?.user_metadata
  const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : ''
  if (fullName.length > 0) {
    return fullName
  }

  const username = typeof metadata?.username === 'string' ? metadata.username.trim() : ''
  return username.length > 0 ? username : 'Guest'
})

const iconMap: Record<AdminSidebarIconName, Component> = {
  dashboard: LayoutDashboard,
  map: Map,
  report: FileText,
  analytics: BarChart3,
  users: Users,
  roles: Shield,
  notifications: Bell,
  settings: Settings,
}

const isActive = (itemPath: string): boolean => route.path.startsWith(itemPath)

const getNavItemClass = (itemPath: string): string => {
  if (isActive(itemPath)) {
    return 'bg-foreground/14 text-foreground ring-1 ring-foreground/25'
  }

  return 'text-foreground/75 hover:bg-foreground/8 hover:text-foreground'
}
</script>

<template>
  <Sidebar collapsible="icon" class="border-r bg-card/70 md:top-16 md:h-[calc(100svh-4rem)]">
    <SidebarHeader class="border-b px-3 py-3">
      <div class="flex items-start justify-between gap-2">
        <div class="group-data-[collapsible=icon]:hidden min-w-0">
          <TypographyLarge as="p" class="truncate text-base tracking-wide">
            {{ userDisplayName }}
          </TypographyLarge>
        </div>
        <SidebarTrigger class="mt-0.5" />
      </div>
    </SidebarHeader>

    <SidebarContent class="px-2 py-4">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in primaryUserNavItems" :key="item.to">
              <SidebarMenuButton
                as-child
                :is-active="isActive(item.to)"
                :tooltip="item.label"
                :class="getNavItemClass(item.to)"
              >
                <RouterLink :to="item.to" class="focus-visible:ring-ring focus-visible:ring-2">
                  <component :is="iconMap[item.icon]" class="h-4 w-4 shrink-0" />
                  <TypographySmall as="span" class="text-sm text-inherit">{{
                    item.label
                  }}</TypographySmall>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
