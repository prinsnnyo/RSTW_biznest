<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import ModeToggle from '@/components/ui/ModeToggle.vue'
import { BUSINESS_ROLE_OPTIONS } from '@/types/pinned-location.types'
import logoImage from '@/assets/images/logo.png'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const roleLabel = computed(() => {
  const role = authStore.businessRole
  if (!role) {
    return 'Space Owner'
  }
  return BUSINESS_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
})

const navItems = computed(() => {
  const items = [
    { label: 'Map', to: '/app/map' },
    { label: 'Home', to: '/app/home' },
    { label: 'My Site', to: '/app/my-site' },
    { label: 'Messages', to: '/app/messages' },
  ]

  if (authStore.isAdmin) {
    items.push({ label: 'Admin', to: '/admin/map' })
  }

  return items
})

const handleLogout = async (): Promise<void> => {
  await authStore.logout()
  await router.push('/auth')
}

const isFullScreenMap = computed(() => route.name === 'space-owner-map')
</script>

<template>
  <div class="bg-far text-foreground flex h-screen flex-col overflow-hidden">
    <header class="bg-card/80 border-border sticky top-0 z-40 shrink-0 border-b backdrop-blur">
      <div
        class="mx-auto flex h-16 w-full items-center justify-between gap-4 px-4"
        :class="isFullScreenMap ? '' : 'max-w-7xl'"
      >
        <div class="flex items-center gap-6">
          <RouterLink to="/app/home" class="flex items-center gap-2">
            <img :src="logoImage" alt="BizNest" class="h-8 w-8 rounded-md object-cover" />
            <div class="leading-tight">
              <p class="text-foreground text-lg font-semibold tracking-tight">BizNest</p>
              <p class="text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                {{ roleLabel }}
              </p>
            </div>
          </RouterLink>
          <nav class="hidden items-center gap-1 md:flex">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-md px-3 py-2 text-sm transition"
              :class="
                route.path.startsWith(item.to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:bg-muted'
              "
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>
        <div class="flex items-center gap-2">
          <ModeToggle />
          <Button variant="outline" size="sm" @click="handleLogout">Sign out</Button>
        </div>
      </div>
    </header>
    <main
      class="min-h-0 w-full flex-1"
      :class="isFullScreenMap ? 'overflow-hidden p-0' : 'mx-auto max-w-7xl overflow-y-auto px-4 py-6'"
    >
      <RouterView />
    </main>
  </div>
</template>
