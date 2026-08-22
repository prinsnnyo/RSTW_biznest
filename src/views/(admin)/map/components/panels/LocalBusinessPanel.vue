<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCcw,
  X,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyMuted, TypographyP, TypographySmall } from '@/components/typography'
import { useAdminMapStore } from '@/stores/admin.map.store'
import { BUSINESS_ROLE_OPTIONS, type BusinessRole, type PinnedLocation } from '@/types/pinned-location.types'

interface RoleGroup {
  role: BusinessRole
  label: string
  color: string
  pins: PinnedLocation[]
}

const ROLE_COLORS: Record<BusinessRole, string> = {
  space_owner: '#0ea5e9',
  entrepreneur: '#f59e0b',
  supplier: '#10b981',
}

const ROLE_LABELS: Record<BusinessRole, string> = BUSINESS_ROLE_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {} as Record<BusinessRole, string>,
)

const adminMapStore = useAdminMapStore()

const expandedRoles = ref<Set<BusinessRole>>(new Set())

const groupedBusinesses = computed((): RoleGroup[] => {
  const groupMap = new Map<BusinessRole, PinnedLocation[]>()

  for (const pin of adminMapStore.localBusinesses) {
    const existing = groupMap.get(pin.role) ?? []
    existing.push(pin)
    groupMap.set(pin.role, existing)
  }

  return [...groupMap.entries()].map(([role, pins]) => ({
    role,
    label: ROLE_LABELS[role] ?? role,
    color: ROLE_COLORS[role] ?? '#6B7280',
    pins,
  }))
})

const selectedBusiness = computed(
  () =>
    adminMapStore.localBusinesses.find(
      (pin) => pin.id === adminMapStore.selectedLocalBusinessId,
    ) ?? null,
)

const hiddenSet = computed(() => new Set(adminMapStore.hiddenBusinessRoles))

function isRoleHidden(role: BusinessRole): boolean {
  return hiddenSet.value.has(role)
}

function isExpanded(role: BusinessRole): boolean {
  return expandedRoles.value.has(role)
}

function toggleExpand(role: BusinessRole): void {
  const next = new Set(expandedRoles.value)
  if (next.has(role)) {
    next.delete(role)
  } else {
    next.add(role)
  }
  expandedRoles.value = next
}

function close(): void {
  adminMapStore.clearSelectedLocalBusiness()
  adminMapStore.activePanel = null
}
</script>

<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l">
    <Card class="flex h-full flex-col rounded-none border-0 shadow-none py-0">
      <CardHeader class="shrink-0 border-b py-4">
        <CardTitle class="flex items-center justify-between text-base">
          <div class="flex items-center gap-2">
            <Building2 class="h-4 w-4 text-emerald-500" />
            <TypographyP as="span" class="m-0 leading-none">Local Business</TypographyP>
          </div>

          <div class="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              :disabled="adminMapStore.isLoadingLocalBusinesses"
              @click="adminMapStore.loadLocalBusinesses(true)"
            >
              <RefreshCcw class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" @click="close">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent class="flex-1 overflow-y-auto p-0">
        <!-- Status messages -->
        <div
          v-if="adminMapStore.isLoadingLocalBusinesses || adminMapStore.localBusinessesError"
          class="px-4 pt-3"
        >
          <TypographyMuted v-if="adminMapStore.isLoadingLocalBusinesses" as="p" class="text-xs">
            Loading local businesses…
          </TypographyMuted>
          <TypographySmall
            v-if="adminMapStore.localBusinessesError"
            as="p"
            class="text-xs text-destructive"
          >
            {{ adminMapStore.localBusinessesError }}
          </TypographySmall>
        </div>

        <!-- Detail view -->
        <div v-if="selectedBusiness" class="p-4">
          <button
            type="button"
            class="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            @click="adminMapStore.clearSelectedLocalBusiness"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            Back to list
          </button>

          <div class="space-y-2 rounded-md border p-3">
            <div class="flex items-center gap-2">
              <TypographyP as="span" class="m-0 flex-1 truncate text-sm font-semibold">
                {{ selectedBusiness.title }}
              </TypographyP>
              <Badge variant="outline">{{ ROLE_LABELS[selectedBusiness.role] }}</Badge>
            </div>

            <TypographyMuted v-if="selectedBusiness.description" as="p" class="text-xs">
              {{ selectedBusiness.description }}
            </TypographyMuted>

            <TypographyMuted as="p" class="text-xs">
              {{ selectedBusiness.latitude.toFixed(6) }}, {{ selectedBusiness.longitude.toFixed(6) }}
            </TypographyMuted>

            <a
              v-if="selectedBusiness.is_published"
              :href="`/sites/${selectedBusiness.id}`"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View public site
              <ExternalLink class="h-3 w-3" />
            </a>
            <TypographyMuted v-else as="p" class="text-xs italic">
              Not published yet.
            </TypographyMuted>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="groupedBusinesses.length === 0 && !adminMapStore.isLoadingLocalBusinesses"
          class="px-4 pt-4"
        >
          <div class="rounded-md border p-3">
            <TypographySmall as="p" class="text-xs text-muted-foreground">
              No local businesses found.
            </TypographySmall>
          </div>
        </div>

        <!-- Role groups -->
        <div v-else class="py-2">
          <div v-for="group in groupedBusinesses" :key="group.role">
            <div class="flex items-center gap-1 px-2 py-1 hover:bg-muted/40">
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left"
                @click="toggleExpand(group.role)"
              >
                <span
                  class="h-3 w-3 shrink-0 rounded-full border"
                  :style="{ backgroundColor: group.color }"
                />
                <TypographySmall
                  as="span"
                  class="flex-1 truncate text-sm font-medium"
                  :class="isRoleHidden(group.role) ? 'text-muted-foreground line-through' : ''"
                >
                  {{ group.label }}
                </TypographySmall>
                <ChevronRight
                  class="h-3.5 w-3.5 shrink-0 transition-transform"
                  :class="isExpanded(group.role) ? 'rotate-90' : ''"
                />
              </button>

              <Button
                variant="ghost"
                size="icon-sm"
                :title="isRoleHidden(group.role) ? `Show ${group.label}` : `Hide ${group.label}`"
                @click="adminMapStore.toggleBusinessRoleVisibility(group.role)"
              >
                <Eye v-if="!isRoleHidden(group.role)" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div v-if="isExpanded(group.role)" class="pb-1">
              <button
                v-for="pin in group.pins"
                :key="pin.id"
                type="button"
                class="mx-2 mb-1 block w-full rounded-md border px-3 py-2 text-left transition-colors"
                :class="
                  adminMapStore.selectedLocalBusinessId === pin.id
                    ? 'border-primary bg-muted/70'
                    : ''
                "
                @click="adminMapStore.handleSelectLocalBusiness(pin.id)"
              >
                <TypographySmall as="span" class="block truncate text-sm font-medium">
                  {{ pin.title }}
                </TypographySmall>
                <TypographyMuted as="p" class="mt-0.5 truncate text-xs text-muted-foreground">
                  {{ pin.is_published ? 'Published' : 'Unpublished' }}
                </TypographyMuted>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </aside>
</template>
