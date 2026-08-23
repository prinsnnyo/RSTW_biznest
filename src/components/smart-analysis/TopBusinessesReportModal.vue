<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { useAlertContext } from '@/composables/useAlert'
import { cn } from '@/lib/utils'
import ReportActionBar from '@/components/smart-analysis/ReportActionBar.vue'
import { useAnalysisReportExport } from '@/composables/useAnalysisReportExport'
import { useSavedReports } from '@/composables/useSavedReports'
import type {
  CompetitionLevel,
  DemandLevel,
  ReportMetric,
  TopBusinessesReport,
} from '@/types/smart-analysis.types'

const props = defineProps<{
  open: boolean
  report: TopBusinessesReport | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { showSuccess } = useAlertContext()
const { isSaved, saveReport } = useSavedReports()
const { exportTopBusinessesToPdf } = useAnalysisReportExport()

/** Ranks whose full analysis is expanded. The top pick opens by default. */
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

function scoreTone(score: number): string {
  if (score >= 85) {
    return 'text-success'
  }
  return score >= 70 ? 'text-primary' : 'text-muted-foreground'
}

function scoreBarTone(score: number): string {
  if (score >= 85) {
    return 'bg-success'
  }
  return score >= 70 ? 'bg-primary' : 'bg-muted-foreground/60'
}

function demandTone(level: DemandLevel): string {
  return level === 'Very High' ? 'border-success/50 text-success' : 'border-primary/50 text-primary'
}

function competitionTone(level: CompetitionLevel): string {
  if (level === 'Dense') {
    return 'border-destructive/50 text-destructive'
  }
  return level === 'Low' ? 'border-success/50 text-success' : 'border-border text-muted-foreground'
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

  exportTopBusinessesToPdf(props.report)
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
            <DialogTitle class="text-xl">Top 5 Best Businesses in this Area</DialogTitle>
            <DialogDescription>
              {{ props.report.areaSummary }} · Generated {{ props.report.generatedAt }}
            </DialogDescription>
          </div>
          <div class="border-primary/40 bg-primary/8 shrink-0 rounded-lg border px-5 py-2 text-center">
            <p class="text-primary text-4xl font-extrabold leading-none tabular-nums">
              {{ props.report.opportunities.length }}
            </p>
            <TypographyMuted as="p" class="mt-1 text-[11px]">ranked opportunities</TypographyMuted>
          </div>
        </div>
      </DialogHeader>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <!-- Criteria, area profile, methodology -->
        <div class="grid gap-4 lg:grid-cols-3">
          <section
            v-for="panel in [
              { title: 'Search Criteria', rows: props.report.criteria },
              { title: 'Area Profile', rows: props.report.areaProfile },
            ]"
            :key="panel.title"
            class="border-border bg-card rounded-lg border p-4"
          >
            <TypographySmall as="h3" class="font-semibold">{{ panel.title }}</TypographySmall>
            <Separator class="my-3" />
            <dl class="grid gap-2.5">
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

          <section class="border-border bg-card rounded-lg border p-4">
            <TypographySmall as="h3" class="font-semibold">Ranking Methodology</TypographySmall>
            <Separator class="my-3" />
            <ul class="grid gap-2.5">
              <li v-for="row in props.report.methodology" :key="row.label" class="grid gap-1">
                <div class="flex items-baseline justify-between gap-2">
                  <TypographySmall as="span" class="font-semibold">{{ row.label }}</TypographySmall>
                  <TypographySmall as="span" class="tabular-nums">{{ row.score }}</TypographySmall>
                </div>
                <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="scoreBarTone(row.score)"
                    :style="{ width: `${row.score}%` }"
                  />
                </div>
                <TypographyMuted as="span" class="text-[11px]">{{ row.detail }}</TypographyMuted>
              </li>
            </ul>
          </section>
        </div>

        <!-- Ranked opportunities -->
        <TypographySmall as="h3" class="mt-6 font-semibold">
          Top {{ props.report.opportunities.length }} Best Businesses for this Area
        </TypographySmall>

        <ol class="mt-3 grid gap-3">
          <li
            v-for="item in props.report.opportunities"
            :key="item.rank"
            :class="
              cn(
                'border-border bg-card overflow-hidden rounded-lg border',
                item.rank === 1 && 'border-success/50',
              )
            "
          >
            <!-- Summary row -->
            <div class="flex flex-wrap items-start gap-4 p-4">
              <span
                :class="
                  cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold tabular-nums',
                    rankTone(item.rank),
                  )
                "
              >
                {{ item.rank }}
              </span>

              <div class="min-w-[16rem] flex-1">
                <TypographySmall as="h4" class="text-base font-semibold">
                  {{ item.name }}
                </TypographySmall>
                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{{ item.categoryLabel }}</Badge>
                  <Badge variant="outline" :class="demandTone(item.demand)">
                    {{ item.demand }} demand
                  </Badge>
                  <Badge variant="outline" :class="competitionTone(item.competition)">
                    {{ item.competition }} competition
                  </Badge>
                </div>
                <TypographyMuted as="p" class="mt-2 text-xs">{{ item.rationale }}</TypographyMuted>
              </div>

              <div class="w-32 shrink-0 text-right">
                <p :class="cn('text-3xl font-extrabold leading-none tabular-nums', scoreTone(item.score))">
                  {{ item.score }}
                </p>
                <TypographyMuted as="p" class="mt-1 text-[11px]">
                  / 100 suitability score
                </TypographyMuted>
                <div class="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="scoreBarTone(item.score)"
                    :style="{ width: `${item.score}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Economics chips -->
            <div class="bg-muted/40 border-border flex flex-wrap gap-x-6 gap-y-2 border-t px-4 py-2.5">
              <div v-for="metric in item.economics" :key="metric.label" class="min-w-0">
                <TypographyMuted as="span" class="block text-[10px] uppercase tracking-wide">
                  {{ metric.label }}
                </TypographyMuted>
                <TypographySmall as="span" class="font-semibold">{{ metric.value }}</TypographySmall>
              </div>
            </div>

            <!-- Expander -->
            <button
              type="button"
              class="hover:bg-muted focus-visible:ring-ring border-border flex w-full items-center justify-center gap-1.5 border-t px-4 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              :aria-expanded="isExpanded(item.rank)"
              @click="toggleRank(item.rank)"
            >
              <TypographySmall as="span" class="text-primary font-semibold">
                {{ isExpanded(item.rank) ? 'Hide Full Analysis' : 'See More — View Full Analysis' }}
              </TypographySmall>
              <ChevronDown
                class="text-primary h-4 w-4 transition-transform"
                :class="isExpanded(item.rank) ? 'rotate-180' : ''"
              />
            </button>

            <!-- Full analysis -->
            <div
              v-if="isExpanded(item.rank)"
              class="border-border grid gap-3 border-t p-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <article
                v-for="section in item.sections"
                :key="section.title"
                class="border-border bg-background rounded-lg border p-3"
              >
                <div class="flex items-start gap-2">
                  <span class="text-base leading-none" aria-hidden="true">{{ section.icon }}</span>
                  <TypographySmall as="h5" class="font-semibold">{{ section.title }}</TypographySmall>
                </div>
                <ul class="mt-2 grid gap-1">
                  <li v-for="bullet in section.bullets" :key="bullet" class="flex gap-1.5">
                    <span class="bg-muted-foreground/50 mt-1.5 h-1 w-1 shrink-0 rounded-full" />
                    <TypographyMuted as="span" class="text-[11px]">{{ bullet }}</TypographyMuted>
                  </li>
                </ul>
                <TypographyMuted as="p" class="mt-2 text-[11px] italic">
                  {{ section.note }}
                </TypographyMuted>
              </article>
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
