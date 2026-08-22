<script setup lang="ts">
defineOptions({
  name: 'AppNavbar',
})

import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useAlertContext } from '@/composables/useAlert'
import ModeToggle from '@/components/ui/ModeToggle.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import logoImage from '@/assets/images/logo.png'

const authStore = useAuthStore()
const router = useRouter()
const { showAlert, showSuccess } = useAlertContext()
const isLoggingOut = ref(false)

const userName = computed(() => {
  const rawUsername = authStore.user?.user_metadata?.username

  return typeof rawUsername === 'string' && rawUsername.trim().length > 0
    ? rawUsername.trim()
    : 'Guest'
})

const userEmail = computed(() => authStore.user?.email?.trim() || '')

const avatarUrl = computed(() => {
  const rawAvatarUrl = authStore.user?.user_metadata?.avatar_url

  return typeof rawAvatarUrl === 'string' && rawAvatarUrl.trim().length > 0
    ? rawAvatarUrl
    : undefined
})

const userInitials = computed(() => {
  const condensedName = userName.value.replace(/[^a-zA-Z0-9]/g, '')

  return condensedName.slice(0, 2).toUpperCase() || 'BN'
})

const handleLogout = async (): Promise<void> => {
  if (!authStore.isLoggedIn || isLoggingOut.value) {
    return
  }

  isLoggingOut.value = true

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
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <nav class="sticky top-0 z-[2000] border-b bg-card/70 backdrop-blur">
    <div class="mx-auto flex h-16 w-full max-w-screen-3xl items-center justify-between px-4">
      <RouterLink
        to="/"
        class="text-md text-foreground dark:text-primary inline-flex items-center gap-3 font-semibold tracking-wide"
      >
        <span
          class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-1 ring-border shadow-lg"
        >
          <img
            :src="logoImage"
            alt="BizNest logo"
            class="h-full w-full object-contain dark:brightness-90"
          />
        </span>
        <span class="text-xl">BizNest</span>
      </RouterLink>

      <div class="flex items-center gap-4">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="ring-offset-background focus-visible:ring-ring inline-flex items-center gap-2 rounded-full px-1 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
              aria-label="Open user menu"
            >
              <Avatar class="h-9 w-9">
                <AvatarImage v-if="avatarUrl" :src="avatarUrl" :alt="`${userName} avatar`" />
                <AvatarFallback>{{ userInitials }}</AvatarFallback>
              </Avatar>
              <span class="max-w-[180px] truncate text-sm font-medium">{{ userName }}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56 z-[2500]">
            <DropdownMenuLabel
              v-if="userEmail"
              class="truncate text-xs font-normal text-muted-foreground"
            >
              {{ userEmail }}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              :disabled="!authStore.isLoggedIn || isLoggingOut"
              @select="handleLogout"
            >
              {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </nav>
</template>
