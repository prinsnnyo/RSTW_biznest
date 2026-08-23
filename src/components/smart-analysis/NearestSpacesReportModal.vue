<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Building2, ChevronDown, Crosshair, MapPin, Phone, Star } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { useAlertContext } from '@/composables/useAlert'
import { cn } from '@/lib/utils'
import ReportActionBar from '@/components/smart-analysis/ReportActionBar.vue'
import { useAnalysisReportExport } from '@/composables/useAnalysisReportExport'
import { useSavedReports } from '@/composables/useSavedReports'
import type {
  NearestSpacesReport,
  ReportMetric,
  SpaceListingMatch,
} from '@/types/smart-analysis.types'

const props = defineProps<{
  open: boolean
  report: NearestSpacesReport | null
}>()

const emit = defineEmits<{
  close: []
  focus: [payload: { lat: number; lng: number; label: string }]
}>()

const { showSuccess } = useAlertContext()
const { isSaved, saveReport } = useSavedReports()
const { exportNearestSpacesToPdf } = useAnalysisReportExport()

/** Ranks whose detail block is expanded. The top match opens by default. */
const expandedRanks = ref<number[]>([1])
/** Listing ids whose photo failed to load, so the placeholder takes over. */
const brokenImages = ref<string[]>([])

watch(
  () => props.report?.id,
  () => {
    expandedRanks.value = [1]
    brokenImages.value = []
  },
)

const isReportSaved = computed(() => (props.report ? isSaved(props.report.id) : false))

function isExpanded(rank: number): boolean {
  return expandedRanks.value.includes(rank)
}

function toggleRank(rank: number): void {
  expandedRanks.value = isExpanded(rank)
    ? expandedRanks.value.filter((value) => value !== rank)
    : [...expandedRanks.value, rank]
}

function hasImage(match: SpaceListingMatch): boolean {
  return Boolean(match.listing.imageUrl) && !brokenImages.value.includes(match.listing.id)
}

function markImageBroken(id: string): void {
  brokenImages.value = [...brokenImages.value, id]
}

function rankTone(rank: number): string {
  if (rank === 1) {
    return 'bg-success text-success-foreground'
  }
  return rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
}

function distanceTone(distanceKm: number): string {
  if (distanceKm <= 1.5) {
    return 'border-success/50 text-success'
  }
  return distanceKm <= 5 ? 'border-primary/50 text-primary' : 'border-border text-muted-foreground'
}

function areaLabel(match: SpaceListingMatch): string {
  const { areaSqmMin, areaSqmMax } = match.listing
  return areaSqmMin === areaSqmMax ? `${areaSqmMin} sqm` : `${areaSqmMin} – ${areaSqmMax} sqm`
}

function handleShowOnMap(match: SpaceListingMatch): void {
  emit('focus', {
    lat: match.listing.lat,
    lng: match.listing.lng,
    label: match.listing.name,
  })
}

function handleSave(): void {
  if (!props.report) {
    return
  }

  saveReport(props.report)
  showSuccess('Report saved to this browser.', { title: 'Report saved' })
}

function handleExport(): void {
  if (!props.report) {
    return
  }

  exportNearestSpacesToPdf(props.report)
}

function handleOpenChange(isOpen: boolean): void {
  if (!isOpen) {
    emit('close')
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent
      v-if="props.report"
      class="flex max-h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-0 p-0 xl:max-w-[1200px]"
    >
      <!-- ── Header band ────────────────────────────────────────────────── -->
      <DialogHeader class="border-border shrink-0 border-b px-6 py-4 text-left">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <DialogTitle class="text-xl">Nearest Space for Rent / Sale</DialogTitle>
            <DialogDescription>
              {{ props.report.areaSummary }} · Generated {{ props.report.generatedAt }}
            </DialogDescription>
          </div>
          <div class="border-primary/40 bg-primary/8 shrink-0 rounded-lg border px-5 py-2 text-center">
            <p class="text-primary text-4xl font-extrabold leading-none tabular-nums">
              {{ props.report.listings.length }}
            </p>
            <TypographyMuted as="p" class="mt-1 text-[11px]">listings matched</TypographyMuted>
          </div>
        </div>
      </DialogHeader>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div class="grid gap-4 lg:grid-cols-2">
          <section
            v-for="panel in [
              { title: 'Search Criteria', rows: props.report.criteria },
              { title: 'Market Profile', rows: props.report.marketProfile },
            ]"
            :key="panel.title"
            class="border-border bg-card rounded-lg border p-4"
          >
            <TypographySmall as="h3" class="font-semibold">{{ panel.title }}</TypographySmall>
            <Separator class="my-3" />
            <dl class="grid gap-2.5 sm:grid-cols-2">
              <div
                v-for="row in (panel.rows as ReportMetric[])"
                :key="row.label"
                class="flex items-baseline justify-between gap-3"
              >
                <dt class="min-w-0">
                  <TypographyMuted as="span" class="block text-xs">{{ row.label }}</TypographyMuted>
                  <TypographyMuted v-if="row.hint" as="span" class="block text-[11px] opacity-70">
                    {{ row.hint }}
                  </TypographyMuted>
                </dt>
                <dd class="shrink-0 text-right">
                  <TypographySmall as="span" class="font-semibold">{{ row.value }}</TypographySmall>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <!-- Ranked listings -->
        <TypographySmall as="h3" class="mt-6 font-semibold">
          Spaces Nearest to the Drawn Area
        </TypographySmall>

        <ol class="mt-3 grid gap-3">
          <li
            v-for="match in props.report.listings"
            :key="match.listing.id"
            :class="
              cn(
                'border-border bg-card overflow-hidden rounded-lg border',
                match.rank === 1 && 'border-success/50',
              )
            "
          >
            <div class="flex flex-col gap-4 p-4 md:flex-row">
              <!-- Photo -->
              <div class="bg-muted relative h-40 w-full shrink-0 overflow-hidden rounded-md md:h-32 md:w-52">
                <img
                  v-if="hasImage(match)"
                  :src="match.listing.imageUrl"
                  :alt="match.listing.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                  @error="markImageBroken(match.listing.id)"
                />
                <div
                  v-else
                  class="bg-primary/10 text-primary/70 flex h-full w-full items-center justify-center"
                >
                  <Building2 class="h-8 w-8" />
                </div>
                <span
                  :class="
                    cn(
                      'absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold tabular-nums shadow',
                      rankTone(match.rank),
                    )
                  "
                >
                  {{ match.rank }}
                </span>
              </div>

              <!-- Detail -->
              <div class="min-w-[16rem] flex-1">
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <TypographySmall as="h4" class="text-base font-semibold">
                    {{ match.listing.name }}
                  </TypographySmall>
                  <TypographySmall as="span" class="text-primary font-semibold">
                    {{ match.priceLabel }}
                  </TypographySmall>
                </div>

                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{{ match.listing.spaceType }}</Badge>
                  <Badge variant="outline" :class="distanceTone(match.distanceKm)">
                    {{ match.distanceKm }} km away
                  </Badge>
                  <Badge variant="outline">{{ areaLabel(match) }}</Badge>
                  <Badge :variant="match.unitsInBand > 0 ? 'default' : 'outline'">
                    {{ match.listing.unitsAvailable }} available
                    <template v-if="match.unitsInBand > 0">
                      · {{ match.unitsInBand }} in band
                    </template>
                  </Badge>
                  <Badge v-if="match.listing.rating" variant="outline" class="gap-1">
                    <Star class="h-3 w-3" />{{ match.listing.rating }}
                  </Badge>
                </div>

                <div class="text-muted-foreground mt-2 grid gap-1 text-xs">
                  <p class="flex items-start gap-1.5">
                    <MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{{ match.listing.address }} · Brgy. {{ match.listing.barangay }}</span>
                  </p>
                  <p v-if="match.listing.contactNumber" class="flex items-center gap-1.5">
                    <Phone class="h-3.5 w-3.5 shrink-0" />
                    <a
                      :href="`tel:${match.listing.contactNumber.replace(/\s/g, '')}`"
                      class="hover:underline"
                    >
                      {{ match.listing.contactNumber }}
                    </a>
                  </p>
                  <p class="tabular-nums">
                    {{ match.listing.lat.toFixed(4) }}, {{ match.listing.lng.toFixed(4) }}
                  </p>
                </div>

                <TypographyMuted as="p" class="mt-2 text-xs">
                  {{ match.listing.description }}
                </TypographyMuted>
              </div>

              <!-- Score + action -->
              <div class="flex shrink-0 flex-row items-end justify-between gap-2 md:w-36 md:flex-col md:items-end">
                <div class="text-right">
                  <p class="text-primary text-3xl font-extrabold leading-none tabular-nums">
                    {{ match.matchScore }}
                  </p>
                  <TypographyMuted as="p" class="mt-1 text-[11px]">/ 100 match score</TypographyMuted>
                </div>
                <Button size="sm" variant="outline" class="md:w-full" @click="handleShowOnMap(match)">
                  <Crosshair class="h-3.5 w-3.5" />
                  <TypographySmall as="span">Show on map</TypographySmall>
                </Button>
              </div>
            </div>

            <button
              type="button"
              class="hover:bg-muted focus-visible:ring-ring border-border flex w-full items-center justify-center gap-1.5 border-t px-4 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              :aria-expanded="isExpanded(match.rank)"
              @click="toggleRank(match.rank)"
            >
              <TypographySmall as="span" class="text-primary font-semibold">
                {{ isExpanded(match.rank) ? 'Hide details' : 'View more details' }}
              </TypographySmall>
              <ChevronDown
                class="text-primary h-4 w-4 transition-transform"
                :class="isExpanded(match.rank) ? 'rotate-180' : ''"
              />
            </button>

            <div v-if="isExpanded(match.rank)" class="border-border grid gap-3 border-t p-4 lg:grid-cols-2">
              <div class="border-border bg-background rounded-lg border p-3">
                <TypographySmall as="h5" class="font-semibold">Amenities</TypographySmall>
                <ul class="mt-2 flex flex-wrap gap-1.5">
                  <li v-for="item in match.listing.amenities" :key="item">
                    <Badge variant="secondary">{{ item }}</Badge>
                  </li>
                </ul>
                <TypographyMuted as="p" class="mt-3 text-[11px] italic">
                  {{ match.matchReason }}
                </TypographyMuted>
              </div>

              <dl class="border-border bg-background grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                <div v-for="term in match.listing.terms" :key="term.label">
                  <dt>
                    <TypographyMuted as="span" class="text-[10px] uppercase tracking-wide">
                      {{ term.label }}
                    </TypographyMuted>
                  </dt>
                  <dd>
                    <TypographySmall as="span">{{ term.value }}</TypographySmall>
                  </dd>
                </div>
              </dl>
            </div>
          </li>
        </ol>

        <TypographyMuted as="p" class="mt-4 text-xs italic">
          {{ props.report.disclaimer }}
        </TypographyMuted>
      </div>

      <ReportActionBar
        :is-saved="isReportSaved"
        @close="emit('close')"
        @save="handleSave"
        @export="handleExport"
      />
    </DialogContent>
  </Dialog>
</template>
