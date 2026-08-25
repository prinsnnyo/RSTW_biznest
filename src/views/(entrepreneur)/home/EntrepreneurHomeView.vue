<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { BUSINESS_ROLE_OPTIONS } from '@/types/pinned-location.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const authStore = useAuthStore()

const roleMeta = computed(() => {
  const role = authStore.businessRole
  if (role === 'space_owner') {
    return {
      title: 'Space Owner workspace',
      blurb: 'Pin your rentable space in Butuan and publish a site visitors can open from the map.',
      action: 'List a space on the map',
    }
  }
  if (role === 'entrepreneur') {
    return {
      title: 'Entrepreneur workspace',
      blurb: 'Showcase your business location and customize a public profile tied to your pin.',
      action: 'Showcase your business',
    }
  }
  if (role === 'supplier') {
    return {
      title: 'Supplier workspace',
      blurb: 'Pin your supply hub and publish product-focused pages for local entrepreneurs.',
      action: 'List your supply location',
    }
  }
  return {
    title: 'Explore Butuan',
    blurb: 'Browse spaces on the map. Become a partner to publish your own site.',
    action: 'Open the map',
  }
})

const roleLabel = computed(() => {
  const role = authStore.businessRole
  return BUSINESS_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? 'Member'
})
</script>

<template>
  <div class="space-y-8">
    <section
      class="bg-primary text-primary-foreground relative overflow-hidden rounded-3xl border border-border px-6 py-10 shadow-sm md:px-10"
    >
      <p class="text-primary-foreground/70 text-xs uppercase tracking-[0.22em]">{{ roleLabel }}</p>
      <h1 class="mt-3 max-w-2xl text-4xl leading-tight font-semibold md:text-5xl">
        {{ roleMeta.title }}
      </h1>
      <p class="text-primary-foreground/85 mt-4 max-w-xl text-sm md:text-base">
        {{ roleMeta.blurb }}
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <Button as-child variant="secondary">
          <RouterLink to="/app/map">{{ roleMeta.action }}</RouterLink>
        </Button>
        <Button
          v-if="authStore.isBusinessUser"
          as-child
          variant="outline"
          class="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
        >
          <RouterLink to="/app/my-site">Open site builder</RouterLink>
        </Button>
        <Button
          v-else
          as-child
          variant="outline"
          class="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
        >
          <RouterLink to="/app/billing">Become a partner</RouterLink>
        </Button>
      </div>
    </section>

    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Discover</CardTitle>
          <CardDescription>
            Browse pins from space owners, entrepreneurs, and suppliers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button as-child variant="secondary" class="w-full">
            <RouterLink to="/app/map">Open map</RouterLink>
          </Button>
        </CardContent>
      </Card>
      <Card v-if="authStore.isBusinessUser">
        <CardHeader>
          <CardTitle>Build</CardTitle>
          <CardDescription>Customize themes, layouts, fonts, and CMS sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button as-child variant="secondary" class="w-full">
            <RouterLink to="/app/my-site">My site</RouterLink>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>Read Contact Us messages from your published site.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button as-child variant="secondary" class="w-full">
            <RouterLink to="/app/messages">Messages</RouterLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
