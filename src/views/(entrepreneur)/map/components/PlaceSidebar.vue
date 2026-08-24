<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPinned,
  Navigation,
  Share2,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import {
  BUSINESS_ROLE_OPTIONS,
  type PinnedLocation,
} from '@/types/pinned-location.types'
import { useAlertContext } from '@/composables/useAlert'

const props = defineProps<{
  open: boolean
  pin: PinnedLocation | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const { showSuccess, showAlert } = useAlertContext()
const activeTab = ref<'overview' | 'about'>('overview')
const carouselIndex = ref(0)

const photos = computed(() => props.pin?.map_images ?? [])

const roleLabel = computed(() => {
  if (!props.pin) return ''
  return BUSINESS_ROLE_OPTIONS.find((option) => option.value === props.pin?.role)?.label ?? props.pin.role
})

const websitePath = computed(
  () => props.pin?.website_url || (props.pin ? `/sites/${props.pin.id}` : '#'),
)

const openChange = (value: boolean): void => {
  emit('update:open', value)
  if (!value) {
    activeTab.value = 'overview'
    carouselIndex.value = 0
  }
}

watch(
  () => props.pin?.id,
  () => {
    carouselIndex.value = 0
    activeTab.value = 'overview'
  },
)

watch(photos, (list) => {
  if (carouselIndex.value >= list.length) {
    carouselIndex.value = Math.max(0, list.length - 1)
  }
})

const prevPhoto = (): void => {
  if (photos.value.length <= 1) return
  carouselIndex.value = (carouselIndex.value - 1 + photos.value.length) % photos.value.length
}

const nextPhoto = (): void => {
  if (photos.value.length <= 1) return
  carouselIndex.value = (carouselIndex.value + 1) % photos.value.length
}

const copyShareLink = async (): Promise<void> => {
  if (!props.pin) return
  const url = `${window.location.origin}${websitePath.value}`
  try {
    await navigator.clipboard.writeText(url)
    showSuccess('Link copied to clipboard.', { title: 'Share' })
  } catch {
    showAlert({
      title: 'Share failed',
      description: 'Could not copy the link.',
      tone: 'destructive',
    })
  }
}

const openDirections = (): void => {
  if (!props.pin) return
  const url = `https://www.google.com/maps/dir/?api=1&destination=${props.pin.latitude},${props.pin.longitude}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <Sheet :open="open" @update:open="openChange">
    <SheetContent
      side="left"
      class="data-[state=open]:duration-300 w-full gap-0 overflow-y-auto p-0 sm:max-w-105"
    >
      <div v-if="pin" class="flex min-h-full flex-col bg-card text-card-foreground">
        <!-- Photo carousel -->
        <div class="bg-muted relative h-56 w-full shrink-0 overflow-hidden sm:h-64">
          <template v-if="photos.length">
            <img
              :src="photos[carouselIndex]?.url"
              :alt="photos[carouselIndex]?.alt || pin.title"
              class="h-full w-full object-contain"
            />

            <template v-if="photos.length > 1">
              <button
                type="button"
                class="bg-background/80 text-foreground hover:bg-background absolute top-1/2 left-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full shadow"
                aria-label="Previous photo"
                @click="prevPhoto"
              >
                <ChevronLeft class="size-5" />
              </button>
              <button
                type="button"
                class="bg-background/80 text-foreground hover:bg-background absolute top-1/2 right-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full shadow"
                aria-label="Next photo"
                @click="nextPhoto"
              >
                <ChevronRight class="size-5" />
              </button>

              <div class="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
                <button
                  v-for="(_, index) in photos"
                  :key="`dot-${index}`"
                  type="button"
                  class="size-2 rounded-full transition"
                  :class="
                    index === carouselIndex
                      ? 'bg-secondary'
                      : 'bg-background/70 hover:bg-background'
                  "
                  :aria-label="`Go to photo ${index + 1}`"
                  @click="carouselIndex = index"
                />
              </div>
            </template>
          </template>
          <div
            v-else
            class="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 text-sm"
          >
            <MapPinned class="size-8 opacity-50" />
            <span>No photos yet</span>
          </div>
        </div>

        <!-- Header -->
        <div class="space-y-3 px-4 pt-4 pb-2">
          <div>
            <h2 class="text-foreground text-2xl leading-tight font-bold tracking-tight">
              {{ pin.title }}
            </h2>
            <p class="text-muted-foreground mt-1 text-sm">
              <span class="text-foreground font-medium">{{ roleLabel }}</span>
              <span class="mx-1.5">·</span>
              Butuan City
            </p>
          </div>

          <!-- Tabs -->
          <div class="border-border flex gap-4 border-b text-sm">
            <button
              v-for="tab in [
                { id: 'overview', label: 'Overview' },
                { id: 'about', label: 'About' },
              ] as const"
              :key="tab.id"
              type="button"
              class="relative -mb-px pb-2.5 font-medium transition"
              :class="
                activeTab === tab.id
                  ? 'text-secondary border-secondary border-b-2'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Action buttons -->
          <div class="flex justify-around gap-2 py-2">
            <button
              type="button"
              class="text-secondary flex flex-col items-center gap-1.5 text-xs font-medium"
              @click="openDirections"
            >
              <span
                class="bg-secondary text-secondary-foreground flex size-11 items-center justify-center rounded-full"
              >
                <Navigation class="size-5" />
              </span>
              Directions
            </button>
            <button
              type="button"
              class="text-secondary flex flex-col items-center gap-1.5 text-xs font-medium"
              @click="showSuccess('Saved for later (local).', { title: 'Saved' })"
            >
              <span
                class="bg-muted text-secondary flex size-11 items-center justify-center rounded-full"
              >
                <Bookmark class="size-5" />
              </span>
              Save
            </button>
            <a
              :href="websitePath"
              target="_blank"
              rel="noopener noreferrer"
              class="text-secondary flex flex-col items-center gap-1.5 text-xs font-medium"
            >
              <span
                class="bg-muted text-secondary flex size-11 items-center justify-center rounded-full"
              >
                <ExternalLink class="size-5" />
              </span>
              Website
            </a>
            <button
              type="button"
              class="text-secondary flex flex-col items-center gap-1.5 text-xs font-medium"
              @click="copyShareLink"
            >
              <span
                class="bg-muted text-secondary flex size-11 items-center justify-center rounded-full"
              >
                <Share2 class="size-5" />
              </span>
              Share
            </button>
          </div>

          <!-- Primary CTA -->
          <Button as-child class="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-11 w-full rounded-full text-base">
            <RouterLink :to="websitePath">Visit website</RouterLink>
          </Button>
        </div>

        <!-- Tab panels -->
        <div class="border-border mt-2 flex-1 border-t px-4 py-4">
          <template v-if="activeTab === 'overview'">
            <p class="text-foreground text-sm leading-relaxed">
              {{ pin.description || 'No description provided yet.' }}
            </p>
            <p class="text-muted-foreground mt-4 text-xs">
              Coordinates: {{ pin.latitude.toFixed(5) }}, {{ pin.longitude.toFixed(5) }}
            </p>
          </template>

          <template v-else>
            <p class="text-muted-foreground text-xs tracking-wide uppercase">Category</p>
            <p class="text-foreground mt-1 text-sm font-medium">{{ roleLabel }}</p>
            <p class="text-muted-foreground mt-4 text-xs tracking-wide uppercase">About</p>
            <p class="text-foreground mt-1 text-sm leading-relaxed">
              {{ pin.description || 'The owner has not added more details yet.' }}
            </p>
          </template>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
