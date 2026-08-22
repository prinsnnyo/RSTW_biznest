<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MapCanvas from '@/components/map/Map.vue'
import PlaceSidebar from '@/views/(space-owner)/map/components/PlaceSidebar.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAlertContext } from '@/composables/useAlert'
import { useAuthStore } from '@/stores/auth.store'
import {
  createPinnedLocation,
  getMyPinnedLocation,
  listPublishedPins,
  updatePinnedLocation,
} from '@/services/pinned-locations.service'
import { ensureDefaultSiteSections } from '@/services/site-sections.service'
import { uploadSiteImage } from '@/services/site-storage.service'
import type { PinnedLocation, PinnedLocationImage } from '@/types/pinned-location.types'
import type { MapProvider } from '@/types/map.types'

const authStore = useAuthStore()
const { showAlert, showSuccess } = useAlertContext()

const mapRef = ref<InstanceType<typeof MapCanvas> | null>(null)
const pins = ref<PinnedLocation[]>([])
const myPin = ref<PinnedLocation | null>(null)
const selectedPin = ref<PinnedLocation | null>(null)
const sheetOpen = ref(false)
const pinMode = ref(false)
const draftPoint = ref<{ lat: number; lng: number } | null>(null)
const draftTitle = ref('')
const draftDescription = ref('')
const draftPhotos = ref<PinnedLocationImage[]>([])
const isSaving = ref(false)
const isUploadingPhoto = ref(false)
const isLoading = ref(true)

const mapProvider = computed<MapProvider>(() => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return key && String(key).trim().length > 0 ? 'google' : 'leaflet'
})

const canPin = computed(() => authStore.isBusinessUser)

const loadPins = async (): Promise<void> => {
  isLoading.value = true
  try {
    pins.value = await listPublishedPins()
    if (authStore.isBusinessUser) {
      myPin.value = await getMyPinnedLocation()
    }
    await mapRef.value?.renderPinnedLocations(
      pins.value.map((pin) => ({
        id: pin.id,
        lat: pin.latitude,
        lng: pin.longitude,
        title: pin.title,
        role: pin.role,
      })),
      (pinId) => {
        selectedPin.value = pins.value.find((pin) => pin.id === pinId) ?? null
        sheetOpen.value = true
      },
    )
  } catch (error) {
    showAlert({
      title: 'Unable to load pins',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const onMapReady = async (): Promise<void> => {
  await loadPins()
  mapRef.value?.setMapClickHandler((point) => {
    if (!pinMode.value || !canPin.value) {
      return
    }
    draftPoint.value = point
    mapRef.value?.focusLocation(point, 'New pin')
  })
}

const startPinMode = (): void => {
  if (!canPin.value) {
    return
  }
  pinMode.value = true
  draftTitle.value = myPin.value?.title ?? ''
  draftDescription.value = myPin.value?.description ?? ''
  draftPhotos.value = [...(myPin.value?.map_images ?? [])]
  draftPoint.value = myPin.value
    ? { lat: myPin.value.latitude, lng: myPin.value.longitude }
    : null
  showSuccess('Click the map to place or move your pin.', { title: 'Pin mode' })
}

const cancelPinMode = (): void => {
  pinMode.value = false
  draftPoint.value = null
  draftPhotos.value = []
}

const removeDraftPhoto = (index: number): void => {
  draftPhotos.value = draftPhotos.value.filter((_, i) => i !== index)
}

const onPhotosSelected = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length === 0) {
    return
  }

  isUploadingPhoto.value = true
  try {
    const uploaded: PinnedLocationImage[] = []
    for (const file of files) {
      uploaded.push(await uploadSiteImage(file))
    }
    draftPhotos.value = [...draftPhotos.value, ...uploaded]
    showSuccess(
      uploaded.length === 1
        ? 'Photo ready. Save the pin to apply it.'
        : `${uploaded.length} photos ready. Save the pin to apply them.`,
      { title: 'Photos uploaded' },
    )
  } catch (error) {
    showAlert({
      title: 'Upload failed',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isUploadingPhoto.value = false
    input.value = ''
  }
}

const savePin = async (): Promise<void> => {
  if (!authStore.businessRole || !draftPoint.value) {
    showAlert({
      title: 'Missing location',
      description: 'Click the map to choose a pin first.',
      tone: 'destructive',
    })
    return
  }

  if (!draftTitle.value.trim()) {
    showAlert({
      title: 'Title required',
      description: 'Give your pin a name.',
      tone: 'destructive',
    })
    return
  }

  isSaving.value = true
  try {
    const nextImages = [...draftPhotos.value]

    if (myPin.value) {
      myPin.value = await updatePinnedLocation(myPin.value.id, {
        title: draftTitle.value.trim(),
        description: draftDescription.value.trim(),
        latitude: draftPoint.value.lat,
        longitude: draftPoint.value.lng,
        website_url: `/sites/${myPin.value.id}`,
        map_images: nextImages,
      })
    } else {
      myPin.value = await createPinnedLocation({
        role: authStore.businessRole,
        title: draftTitle.value.trim(),
        description: draftDescription.value.trim(),
        latitude: draftPoint.value.lat,
        longitude: draftPoint.value.lng,
      })
      if (nextImages.length > 0) {
        myPin.value = await updatePinnedLocation(myPin.value.id, {
          map_images: nextImages,
          website_url: `/sites/${myPin.value.id}`,
        })
      }
      await ensureDefaultSiteSections(myPin.value.id)
    }

    pinMode.value = false
    draftPhotos.value = []
    showSuccess('Your location pin is saved and linked to your site.', { title: 'Pin saved' })
    await loadPins()
  } catch (error) {
    showAlert({
      title: 'Could not save pin',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  // map ready handler loads data
})
</script>

<template>
  <div class="relative h-full min-h-0 w-full overflow-hidden">
    <div class="absolute inset-x-0 top-3 z-20 mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4">
      <div class="bg-card/90 rounded-full px-4 py-2 shadow-sm backdrop-blur">
        <p class="text-foreground text-sm font-semibold">Explore Butuan</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button v-if="canPin && !pinMode" @click="startPinMode">
          {{ myPin ? 'Move / update pin' : 'Pin my location' }}
        </Button>
        <template v-if="pinMode">
          <Button variant="outline" :disabled="isSaving" @click="cancelPinMode">Cancel</Button>
          <Button :disabled="isSaving" @click="savePin">Save pin</Button>
        </template>
      </div>
    </div>

    <div
      v-if="pinMode"
      class="border-border bg-card/95 absolute inset-x-4 top-16 z-20 mx-auto grid max-w-4xl gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur md:grid-cols-2"
    >
      <div class="space-y-2">
        <Label for="pin-title">Title</Label>
        <Input id="pin-title" v-model="draftTitle" placeholder="e.g. Downtown loft for rent" />
      </div>
      <div class="space-y-2">
        <Label for="pin-description">Description</Label>
        <Input
          id="pin-description"
          v-model="draftDescription"
          placeholder="Short summary for the map card"
        />
      </div>
      <div class="space-y-2 md:col-span-2">
        <Label for="pin-photos">Map photos (shown when your pin is clicked — not on your website)</Label>
        <Input
          id="pin-photos"
          type="file"
          accept="image/*"
          multiple
          :disabled="isUploadingPhoto || isSaving"
          @change="onPhotosSelected"
        />
        <p v-if="isUploadingPhoto" class="text-muted-foreground text-xs">Uploading…</p>
        <div v-if="draftPhotos.length" class="mt-2 flex flex-wrap gap-3">
          <div
            v-for="(image, index) in draftPhotos"
            :key="`${image.url}-${index}`"
            class="border-border relative w-28 overflow-hidden rounded-xl border"
          >
            <img
              :src="image.url"
              :alt="image.alt || `Photo ${index + 1}`"
              class="h-24 w-full object-cover"
            />
            <p
              v-if="index === 0"
              class="bg-secondary/90 text-secondary-foreground absolute top-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
            >
              Featured
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="absolute right-1 bottom-1 h-7 px-2 text-xs"
              :disabled="isSaving || isUploadingPhoto"
              @click="removeDraftPhoto(index)"
            >
              Remove
            </Button>
          </div>
        </div>
        <p v-else class="text-muted-foreground text-xs">
          Select one or more images for the map pin card. Website photos are managed in My Site.
        </p>
      </div>
      <p class="text-muted-foreground text-xs md:col-span-2">
        {{
          draftPoint
            ? `Selected: ${draftPoint.lat.toFixed(5)}, ${draftPoint.lng.toFixed(5)}`
            : 'Click anywhere on the map to set coordinates.'
        }}
      </p>
    </div>

    <div class="absolute inset-0">
      <MapCanvas
        ref="mapRef"
        :provider="mapProvider"
        :center="{ lat: 8.9475, lng: 125.5406 }"
        @ready="onMapReady"
      />
      <div
        v-if="isLoading"
        class="bg-primary/80 text-primary-foreground pointer-events-none absolute inset-x-0 top-0 px-4 py-2 text-center text-xs"
      >
        Loading pins…
      </div>
    </div>

    <PlaceSidebar v-model:open="sheetOpen" :pin="selectedPin" />
  </div>
</template>
