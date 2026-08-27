<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown, Crosshair, Mail, MapPin, Phone } from 'lucide-vue-next'
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
  NearestSuppliersReport,
  ReportMetric,
  SupplierMatch,
} from '@/types/smart-analysis.types'

const props = defineProps<{
  open: boolean
  report: NearestSuppliersReport | null
}>()

const emit = defineEmits<{
  close: []
  focus: [payload: { lat: number; lng: number; label: string }]
}>()

const { showSuccess } = useAlertContext()
const { isSaved, saveReport } = useSavedReports()
const { exportNearestSuppliersToPdf } = useAnalysisReportExport()

/** Ranks whose detail block is expanded. The top match opens by default. */
const expandedRanks = ref<number[]>([1])

watch(
  () => props.report?.id,
  () => {
    expandedRanks.value = [1]
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

function rankTone(rank: number): string {
  if (rank === 1) {
    return 'bg-success text-success-foreground'
  }
  return rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
}

function distanceTone(distanceKm: number): string {
  if (distanceKm <= 3) {
    return 'border-success/50 text-success'
  }
  return distanceKm <= 8 ? 'border-primary/50 text-primary' : 'border-border text-muted-foreground'
}

function handleShowOnMap(match: SupplierMatch): void {
  emit('focus', {
    lat: match.record.lat,
    lng: match.record.lng,
    label: match.record.name,
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

  exportNearestSuppliersToPdf(props.report)
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
      class="flex max-h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-0 p-0 sm:max-w-[96vw] xl:max-w-[1200px]"
    >
      <!-- ── Header band ────────────────────────────────────────────────── -->
      <DialogHeader class="border-border shrink-0 border-b px-6 py-4 text-left">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <DialogTitle class="text-xl">Nearest Suppliers</DialogTitle>
            <DialogDescription>
              {{ props.report.areaSummary }} · Generated {{ props.report.generatedAt }}
            </DialogDescription>
          </div>
          <div class="border-primary/40 bg-primary/8 shrink-0 rounded-lg border px-5 py-2 text-center">
            <p class="text-primary text-4xl font-extrabold leading-none tabular-nums">
              {{ props.report.suppliers.length }}
            </p>
            <TypographyMuted as="p" class="mt-1 text-[11px]">suppliers matched</TypographyMuted>
          </div>
        </div>
      </DialogHeader>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div class="grid gap-4 lg:grid-cols-2">
          <section
            v-for="panel in [
              { title: 'Search Criteria', rows: props.report.criteria },
              { title: 'Supply Chain Profile', rows: props.report.supplyProfile },
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

        <!-- Ranked suppliers -->
        <TypographySmall as="h3" class="mt-6 font-semibold">
          Suppliers Nearest to the Drawn Area
        </TypographySmall>

        <ol class="mt-3 grid gap-3">
          <li
            v-for="match in props.report.suppliers"
            :key="match.record.name"
            :class="
              cn(
                'border-border bg-card overflow-hidden rounded-lg border',
                match.rank === 1 && 'border-success/50',
              )
            "
          >
            <div class="flex flex-wrap items-start gap-4 p-4">
              <span
                :class="
                  cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold tabular-nums',
                    rankTone(match.rank),
                  )
                "
              >
                {{ match.rank }}
              </span>

              <div class="min-w-[18rem] flex-1">
                <TypographySmall as="h4" class="text-base font-semibold">
                  {{ match.record.name }}
                </TypographySmall>
                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{{ match.record.trade }}</Badge>
                  <Badge variant="outline" :class="distanceTone(match.distanceKm)">
                    {{ match.distanceKm }} km away
                  </Badge>
                  <Badge variant="outline">{{ match.record.yearsOperating }} yrs operating</Badge>
                </div>

                <div class="text-muted-foreground mt-2 grid gap-1 text-xs">
                  <p class="flex items-start gap-1.5">
                    <MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{{ match.record.address }} · Brgy. {{ match.record.barangay }}</span>
                  </p>
                  <p class="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span class="flex items-center gap-1.5">
                      <Phone class="h-3.5 w-3.5 shrink-0" />
                      <a :href="`tel:${match.record.phone.replace(/\s/g, '')}`" class="hover:underline">
                        {{ match.record.phone }}
                      </a>
                    </span>
                    <span class="flex items-center gap-1.5">
                      <Mail class="h-3.5 w-3.5 shrink-0" />
                      <a :href="`mailto:${match.record.email}`" class="hover:underline">
                        {{ match.record.email }}
                      </a>
                    </span>
                  </p>
                  <p class="tabular-nums">
                    {{ match.record.lat.toFixed(4) }}, {{ match.record.lng.toFixed(4) }}
                  </p>
                </div>

                <TypographyMuted as="p" class="mt-2 text-xs italic">
                  {{ match.matchReason }}
                </TypographyMuted>
              </div>

              <div class="flex w-40 shrink-0 flex-col items-end gap-2">
                <div class="text-right">
                  <p class="text-primary text-3xl font-extrabold leading-none tabular-nums">
                    {{ match.matchScore }}
                  </p>
                  <TypographyMuted as="p" class="mt-1 text-[11px]">/ 100 match score</TypographyMuted>
                </div>
                <Button size="sm" variant="outline" class="w-full" @click="handleShowOnMap(match)">
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
                <TypographySmall as="h5" class="font-semibold">Specialties</TypographySmall>
                <ul class="mt-2 flex flex-wrap gap-1.5">
                  <li v-for="item in match.record.specialties" :key="item">
                    <Badge variant="secondary">{{ item }}</Badge>
                  </li>
                </ul>
              </div>

              <dl class="border-border bg-background grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                <div
                  v-for="term in [
                    { label: 'Minimum order', value: match.record.minimumOrder },
                    { label: 'Payment terms', value: match.record.paymentTerms },
                    { label: 'Delivery', value: match.record.delivery },
                    { label: 'Lead time', value: match.record.leadTime },
                    { label: 'Operating hours', value: match.record.operatingHours },
                  ]"
                  :key="term.label"
                >
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
