<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { useAlertContext } from '@/composables/useAlert'
import { cn } from '@/lib/utils'
import { useSavedReports } from '@/composables/useSavedReports'
import ReportActionBar from '@/components/smart-analysis/ReportActionBar.vue'
import { useAnalysisReportExport } from '@/composables/useAnalysisReportExport'
import type {
  FootTrafficLevel,
  ReportMetric,
  SuitabilityReport,
} from '@/types/smart-analysis.types'

const props = defineProps<{
  open: boolean
  report: SuitabilityReport | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { showSuccess } = useAlertContext()
const { isSaved, saveReport } = useSavedReports()
const { exportSuitabilityToPdf } = useAnalysisReportExport()

const isReportSaved = computed(() => (props.report ? isSaved(props.report.id) : false))

const verdictClasses = computed(() => {
  switch (props.report?.verdict.tone) {
    case 'success':
      return { text: 'text-success', bar: 'bg-success', ring: 'border-success/40 bg-success/8' }
    case 'destructive':
      return {
        text: 'text-destructive',
        bar: 'bg-destructive',
        ring: 'border-destructive/40 bg-destructive/8',
      }
    default:
      return { text: 'text-primary', bar: 'bg-primary', ring: 'border-primary/40 bg-primary/8' }
  }
})

function scoreTone(score: number): string {
  if (score >= 75) {
    return 'bg-success'
  }
  return score >= 50 ? 'bg-primary' : 'bg-destructive'
}

function trafficTone(level: FootTrafficLevel): string {
  switch (level) {
    case 'Peak':
      return 'bg-success'
    case 'High':
      return 'bg-primary'
    case 'Moderate':
      return 'bg-muted-foreground/60'
    default:
      return 'bg-muted-foreground/30'
  }
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

  exportSuitabilityToPdf(props.report)
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
            <DialogTitle class="text-xl">Business Suitability Analysis</DialogTitle>
            <DialogDescription>
              {{ props.report.areaSummary }} · Generated {{ props.report.generatedAt }}
            </DialogDescription>
          </div>
          <div :class="cn('shrink-0 rounded-lg border px-5 py-2 text-center', verdictClasses.ring)">
            <p :class="cn('text-4xl font-extrabold tabular-nums leading-none', verdictClasses.text)">
              {{ props.report.verdict.score }}
            </p>
            <TypographyMuted as="p" class="mt-1 text-[11px]">out of 100</TypographyMuted>
            <TypographySmall :class="cn('mt-1 block font-semibold', verdictClasses.text)">
              {{ props.report.verdict.label }}
            </TypographySmall>
          </div>
        </div>
      </DialogHeader>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <TypographySmall as="p">{{ props.report.verdict.headline }}</TypographySmall>
        <TypographyMuted as="p" class="mt-1 text-xs italic">
          {{ props.report.disclaimer }}
        </TypographyMuted>

        <!-- Fact panels -->
        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <section
            v-for="panel in [
              { title: 'Business Profile', rows: props.report.selection },
              { title: 'Area Demographics', rows: props.report.demographics },
              { title: 'Market & Purchasing Power', rows: props.report.market },
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
        </div>

        <!-- Score breakdown + foot traffic -->
        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <section class="border-border bg-card rounded-lg border p-4">
            <TypographySmall as="h3" class="font-semibold">
              Suitability Score Breakdown
            </TypographySmall>
            <Separator class="my-3" />
            <ul class="grid gap-3">
              <li v-for="row in props.report.scoreRows" :key="row.label" class="grid gap-1">
                <div class="flex items-baseline justify-between gap-2">
                  <TypographySmall as="span" class="font-semibold">{{ row.label }}</TypographySmall>
                  <TypographySmall as="span" class="tabular-nums">{{ row.score }}</TypographySmall>
                </div>
                <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="scoreTone(row.score)"
                    :style="{ width: `${row.score}%` }"
                  />
                </div>
                <TypographyMuted as="span" class="text-[11px]">{{ row.detail }}</TypographyMuted>
              </li>
            </ul>
          </section>

          <section class="border-border bg-card rounded-lg border p-4">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <TypographySmall as="h3" class="font-semibold">Foot Traffic by Time</TypographySmall>
              <Badge variant="secondary">
                {{ props.report.footTraffic.dailyEstimate }} daily passers
              </Badge>
            </div>
            <Separator class="my-3" />
            <ul class="grid gap-2.5">
              <li v-for="band in props.report.footTraffic.bands" :key="band.window" class="grid gap-1">
                <div class="flex items-baseline justify-between gap-2">
                  <TypographySmall as="span" :class="band.level === 'Peak' ? 'font-semibold' : ''">
                    {{ band.window }}
                  </TypographySmall>
                  <TypographyMuted as="span" class="shrink-0 text-[11px] tabular-nums">
                    {{ band.volume }}
                  </TypographyMuted>
                </div>
                <div class="flex items-center gap-2">
                  <div class="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="trafficTone(band.level)"
                      :style="{ width: `${Math.round((band.share / 45) * 100)}%` }"
                    />
                  </div>
                  <Badge
                    :variant="band.level === 'Peak' ? 'default' : 'outline'"
                    class="w-20 shrink-0 justify-center text-[10px]"
                  >
                    {{ band.level }}
                  </Badge>
                </div>
              </li>
            </ul>
            <TypographyMuted as="p" class="mt-3 text-[11px]">
              {{ props.report.footTraffic.note }}
            </TypographyMuted>
          </section>
        </div>

        <!-- Analysis basis -->
        <section class="mt-4">
          <TypographySmall as="h3" class="font-semibold">Analysis Basis</TypographySmall>
          <div class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="item in props.report.basis"
              :key="item.title"
              class="border-border bg-card rounded-lg border p-4"
            >
              <div class="flex items-start gap-2">
                <span class="text-lg leading-none" aria-hidden="true">{{ item.icon }}</span>
                <TypographySmall as="h4" class="font-semibold">{{ item.title }}</TypographySmall>
              </div>
              <TypographyMuted as="p" class="mt-2 text-xs">{{ item.body }}</TypographyMuted>
              <ul class="mt-2 grid gap-1">
                <li v-for="bullet in item.bullets" :key="bullet" class="flex gap-1.5">
                  <span class="bg-muted-foreground/50 mt-1.5 h-1 w-1 shrink-0 rounded-full" />
                  <TypographyMuted as="span" class="text-[11px]">{{ bullet }}</TypographyMuted>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <!-- Recommendations + risks -->
        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <section class="border-success/40 bg-success/6 rounded-lg border p-4">
            <TypographySmall as="h3" class="text-success font-semibold">
              Recommendations
            </TypographySmall>
            <ul class="mt-2 grid gap-1.5">
              <li v-for="item in props.report.recommendations" :key="item" class="flex gap-2">
                <span class="bg-success mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <TypographyMuted as="span" class="text-xs">{{ item }}</TypographyMuted>
              </li>
            </ul>
          </section>

          <section class="border-destructive/40 bg-destructive/6 rounded-lg border p-4">
            <TypographySmall as="h3" class="text-destructive font-semibold">
              Risks & Watch-outs
            </TypographySmall>
            <ul class="mt-2 grid gap-1.5">
              <li v-for="item in props.report.risks" :key="item" class="flex gap-2">
                <span class="bg-destructive mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <TypographyMuted as="span" class="text-xs">{{ item }}</TypographyMuted>
              </li>
            </ul>
          </section>
        </div>
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
