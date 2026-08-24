<script setup lang="ts">
import { ref } from 'vue'
import type { ChatRecommendation } from '@/types/chatbot.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { Building2, ImageOff, MapPin, Phone, Star, Store } from 'lucide-vue-next'

const props = defineProps<{ recommendation: ChatRecommendation }>()

const emit = defineEmits<{
  'view-on-map': [location: { lat: number; lng: number; name: string; id?: string }]
}>()

const hasImageError = ref(false)

const placeName = (): string =>
  props.recommendation.kind === 'rental-space'
    ? props.recommendation.space.name
    : props.recommendation.place.name

const imageUrl = (): string | undefined =>
  props.recommendation.kind === 'rental-space'
    ? props.recommendation.space.imageUrl
    : props.recommendation.place.imageUrl

function formatRent(rent: number): string {
  return `₱${rent.toLocaleString('en-PH')}/mo`
}

function handleViewOnMap(): void {
  if (props.recommendation.kind === 'rental-space') {
    const { location, name } = props.recommendation.space
    emit('view-on-map', { lat: location.lat, lng: location.lng, name, id: props.recommendation.space.id })
    return
  }

  const { location, name } = props.recommendation.place
  emit('view-on-map', { lat: location.lat, lng: location.lng, name })
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border bg-background/60">
    <!-- Picture -->
    <div class="relative h-24 w-full bg-muted">
      <img
        v-if="imageUrl() && !hasImageError"
        :src="imageUrl()"
        :alt="placeName()"
        class="h-full w-full object-cover"
        loading="lazy"
        @error="hasImageError = true"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-primary/10 text-primary/70"
      >
        <Building2 v-if="recommendation.kind === 'rental-space'" class="h-8 w-8" />
        <Store v-else class="h-8 w-8" />
      </div>
      <span
        v-if="hasImageError && imageUrl()"
        class="absolute bottom-1 right-1 rounded bg-background/80 p-1 text-muted-foreground"
      >
        <ImageOff class="h-3 w-3" />
      </span>
    </div>

    <div class="p-3">
      <div class="flex items-start justify-between gap-2">
        <TypographySmall as="p" class="font-semibold">
          {{
            recommendation.kind === 'rental-space'
              ? recommendation.space.name
              : recommendation.place.name
          }}
        </TypographySmall>
        <span
          v-if="recommendation.kind === 'rental-space' && recommendation.space.rating"
          class="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground"
        >
          <Star class="h-3 w-3 fill-current" />
          {{ recommendation.space.rating.toFixed(1) }}
        </span>
      </div>

      <TypographyMuted as="p" class="mt-0.5 text-xs">
        <MapPin class="mr-1 inline h-3 w-3 align-[-1px]" />
        {{
          recommendation.kind === 'rental-space'
            ? `${recommendation.space.address}, Brgy. ${recommendation.space.barangay}`
            : `Brgy. ${recommendation.place.barangay}`
        }}
      </TypographyMuted>

      <TypographyMuted
        v-if="recommendation.kind === 'rental-space' && recommendation.space.description"
        as="p"
        class="mt-1.5 text-xs leading-relaxed"
      >
        {{ recommendation.space.description }}
      </TypographyMuted>

      <TypographySmall
        v-if="recommendation.kind === 'rental-space' && recommendation.space.contactNumber"
        as="p"
        class="mt-1.5 flex items-center gap-1 text-xs"
      >
        <Phone class="h-3 w-3 text-muted-foreground" />
        {{ recommendation.space.contactNumber }}
      </TypographySmall>

      <div v-if="recommendation.kind === 'rental-space'" class="mt-2 flex flex-wrap gap-1">
        <Badge v-if="recommendation.space.monthlyRent !== undefined" variant="secondary" class="text-[11px]">
          {{ formatRent(recommendation.space.monthlyRent) }}
        </Badge>
        <Badge v-if="recommendation.space.areaSqm !== undefined" variant="secondary" class="text-[11px]">
          {{ recommendation.space.areaSqm }} sqm
        </Badge>
        <Badge variant="secondary" class="text-[11px] capitalize">
          {{ recommendation.space.spaceType.replace('-', ' ') }}
        </Badge>
      </div>

      <Separator class="my-2" />

      <Button size="sm" variant="outline" class="w-full" @click="handleViewOnMap">
        <MapPin class="h-3.5 w-3.5" />
        View on map
      </Button>
    </div>
  </div>
</template>
