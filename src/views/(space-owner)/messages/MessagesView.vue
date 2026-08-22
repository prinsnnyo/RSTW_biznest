<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useAlertContext } from '@/composables/useAlert'
import {
  listMessagesForPin,
  markMessageRead,
} from '@/services/contact-messages.service'
import { getMyPinnedLocation } from '@/services/pinned-locations.service'
import type { ContactMessage } from '@/types/pinned-location.types'

const { showAlert, showSuccess } = useAlertContext()
const messages = ref<ContactMessage[]>([])
const hasPin = ref(false)
const isLoading = ref(true)

const load = async (): Promise<void> => {
  isLoading.value = true
  try {
    const pin = await getMyPinnedLocation()
    hasPin.value = !!pin
    if (!pin) {
      messages.value = []
      return
    }
    messages.value = await listMessagesForPin(pin.id)
  } catch (error) {
    showAlert({
      title: 'Unable to load messages',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const markRead = async (message: ContactMessage): Promise<void> => {
  try {
    await markMessageRead(message.id, true)
    message.is_read = true
    showSuccess('Marked as read.', { title: 'Inbox' })
  } catch (error) {
    showAlert({
      title: 'Update failed',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-foreground text-3xl font-semibold">Messages</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Contact form submissions from your public website.
      </p>
    </div>

    <div
      v-if="isLoading"
      class="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm"
    >
      Loading messages…
    </div>

    <div
      v-else-if="!hasPin"
      class="border-border bg-card rounded-2xl border border-dashed p-8 text-center"
    >
      <p class="text-muted-foreground text-sm">
        Pin a location and publish your site to receive messages.
      </p>
      <Button as-child class="mt-4">
        <RouterLink to="/app/map">Go to map</RouterLink>
      </Button>
    </div>

    <div
      v-else-if="messages.length === 0"
      class="border-border bg-card text-muted-foreground rounded-2xl border p-8 text-center text-sm"
    >
      No messages yet.
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="message in messages"
        :key="message.id"
        class="border-border bg-card rounded-2xl border p-4"
        :class="message.is_read ? 'opacity-80' : 'ring-ring/40 ring-1'"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-foreground font-medium">{{ message.sender_name }}</p>
            <p class="text-muted-foreground text-xs">{{ message.sender_email }}</p>
          </div>
          <p class="text-muted-foreground text-xs">
            {{ new Date(message.created_at).toLocaleString() }}
          </p>
        </div>
        <p class="text-foreground/90 mt-3 text-sm whitespace-pre-wrap">{{ message.message }}</p>
        <Button
          v-if="!message.is_read"
          size="sm"
          variant="outline"
          class="mt-3"
          @click="markRead(message)"
        >
          Mark as read
        </Button>
      </li>
    </ul>
  </div>
</template>
