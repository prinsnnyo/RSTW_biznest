<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Header from './components/Header.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listAllPinsForAdmin } from '@/services/pinned-locations.service'
import {
  countUnreadMessages,
  listRecentMessagesForAdmin,
} from '@/services/contact-messages.service'
import {
  BUSINESS_ROLE_OPTIONS,
  type ContactMessage,
  type PinnedLocation,
} from '@/types/pinned-location.types'

const pins = ref<PinnedLocation[]>([])
const messages = ref<ContactMessage[]>([])
const unreadCount = ref(0)
const isLoading = ref(true)
const errorMessage = ref('')

const counts = computed(() => {
  const byRole = {
    space_owner: 0,
    entrepreneur: 0,
    supplier: 0,
  }
  pins.value.forEach((pin) => {
    byRole[pin.role] += 1
  })
  return {
    totalPins: pins.value.length,
    published: pins.value.filter((pin) => pin.is_published).length,
    unread: unreadCount.value,
    byRole,
  }
})

const roleLabel = (role: PinnedLocation['role']): string =>
  BUSINESS_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role

const load = async (): Promise<void> => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [pinRows, messageRows, unread] = await Promise.all([
      listAllPinsForAdmin(),
      listRecentMessagesForAdmin(15),
      countUnreadMessages(),
    ])
    pins.value = pinRows
    messages.value = messageRows
    unreadCount.value = unread
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load dashboard.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="space-y-6 p-4 md:p-6">
    <Header />

    <div v-if="errorMessage" class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Pinned locations</CardDescription>
          <CardTitle class="text-3xl">{{ counts.totalPins }}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Published sites</CardDescription>
          <CardTitle class="text-3xl">{{ counts.published }}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Unread messages</CardDescription>
          <CardTitle class="text-3xl">{{ counts.unread }}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>By role</CardDescription>
          <CardTitle class="text-base font-medium leading-relaxed">
            SO {{ counts.byRole.space_owner }} · EN {{ counts.byRole.entrepreneur }} · SU
            {{ counts.byRole.supplier }}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent pins</CardTitle>
            <CardDescription>Latest business locations on the map</CardDescription>
          </div>
          <Button as-child size="sm" variant="outline">
            <RouterLink to="/app/map">Open user map</RouterLink>
          </Button>
        </CardHeader>
        <CardContent>
          <p v-if="isLoading" class="text-sm text-muted-foreground">Loading…</p>
          <p v-else-if="pins.length === 0" class="text-sm text-muted-foreground">No pins yet.</p>
          <ul v-else class="space-y-3">
            <li
              v-for="pin in pins.slice(0, 8)"
              :key="pin.id"
              class="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0"
            >
              <div>
                <p class="font-medium">{{ pin.title }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ roleLabel(pin.role) }} · {{ pin.is_published ? 'Published' : 'Draft' }}
                </p>
              </div>
              <Button as-child size="sm" variant="ghost">
                <RouterLink :to="`/sites/${pin.id}`">View</RouterLink>
              </Button>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent messages</CardTitle>
          <CardDescription>Contact form activity across sites</CardDescription>
        </CardHeader>
        <CardContent>
          <p v-if="isLoading" class="text-sm text-muted-foreground">Loading…</p>
          <p v-else-if="messages.length === 0" class="text-sm text-muted-foreground">
            No messages yet.
          </p>
          <ul v-else class="space-y-3">
            <li
              v-for="message in messages"
              :key="message.id"
              class="border-b border-border/60 pb-3 last:border-0"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="font-medium">{{ message.sender_name }}</p>
                <span class="text-[11px] text-muted-foreground">
                  {{ message.is_read ? 'Read' : 'Unread' }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground">{{ message.sender_email }}</p>
              <p class="mt-1 line-clamp-2 text-sm">{{ message.message }}</p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
