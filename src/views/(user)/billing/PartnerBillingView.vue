<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Check, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { PARTNER_PLANS, formatPlanPrice, getPartnerPlan, type PartnerPlanId } from '@/utils/partner-plans'

const route = useRoute()

const planFromQuery = (): PartnerPlanId => {
  const value = route.query.plan
  const id = Array.isArray(value) ? value[0] : value
  return PARTNER_PLANS.some((plan) => plan.id === id) ? (id as PartnerPlanId) : 'growth'
}

const selectedPlanId = ref<PartnerPlanId>(planFromQuery())

const selectedPlan = computed(() => getPartnerPlan(selectedPlanId.value))

const applyHref = computed(() => ({
  name: 'user-apply-business',
  query: { plan: selectedPlanId.value },
}))
</script>

<template>
  <div class="relative mx-auto max-w-6xl px-4 py-8 md:py-12">
    <div
      class="pointer-events-none absolute inset-x-8 top-0 h-56 rounded-full bg-primary/12 blur-3xl"
    />

    <header class="relative mb-10 max-w-2xl">
      <p class="text-primary text-xs font-semibold tracking-[0.22em] uppercase">Partner billing</p>
      <h1 class="text-foreground mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
        Pick a plan, then apply.
      </h1>
      <p class="text-muted-foreground mt-3 text-sm leading-relaxed md:text-base">
        Regular members can browse the city for free. A partner subscription unlocks your pin, public
        site, and the application form for space owners, entrepreneurs, and suppliers.
      </p>
    </header>

    <div class="relative grid gap-4 lg:grid-cols-3">
      <article
        v-for="plan in PARTNER_PLANS"
        :key="plan.id"
        class="border-border bg-card/80 relative flex flex-col overflow-hidden rounded-3xl border p-6 shadow-sm backdrop-blur transition"
        :class="
          selectedPlanId === plan.id
            ? 'ring-primary/70 border-primary/40 ring-2'
            : 'hover:border-foreground/20'
        "
      >
        <div
          v-if="plan.featured"
          class="bg-primary text-primary-foreground absolute top-4 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        >
          <Sparkles class="size-3" />
          Most chosen
        </div>

        <p class="text-muted-foreground text-sm font-medium">{{ plan.name }}</p>
        <p class="text-foreground mt-2 flex items-end gap-1">
          <span class="text-4xl font-semibold tracking-tight">{{ formatPlanPrice(plan.price) }}</span>
          <span class="text-muted-foreground mb-1 text-sm">/ month</span>
        </p>
        <p class="text-muted-foreground mt-2 min-h-10 text-sm">{{ plan.tagline }}</p>

        <ul class="mt-6 flex flex-1 flex-col gap-2.5">
          <li
            v-for="grant in plan.grants"
            :key="grant"
            class="text-foreground flex items-start gap-2.5 text-sm leading-snug"
          >
            <span
              class="bg-primary/15 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
            >
              <Check class="size-3.5" stroke-width="2.5" />
            </span>
            {{ grant }}
          </li>
        </ul>

        <Button
          class="mt-8 h-11 rounded-full"
          :variant="selectedPlanId === plan.id ? 'default' : 'outline'"
          @click="selectedPlanId = plan.id"
        >
          {{ selectedPlanId === plan.id ? 'Selected' : `Choose ${plan.name}` }}
        </Button>
      </article>
    </div>

    <section
      class="border-border bg-card/90 relative mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl border p-6 shadow-sm md:flex-row md:items-center"
    >
      <div>
        <p class="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">Next</p>
        <p class="text-foreground mt-1 text-lg font-semibold">
          {{ selectedPlan.name }} · {{ formatPlanPrice(selectedPlan.price) }}/mo
        </p>
        <p class="text-muted-foreground mt-1 max-w-xl text-sm">
          Continue to the partner application. Superadmin reviews your documents before the
          subscription benefits go live.
        </p>
      </div>
      <Button as-child class="h-12 w-full rounded-full px-8 text-base md:w-auto">
        <RouterLink :to="applyHref">Become a partner</RouterLink>
      </Button>
    </section>
  </div>
</template>
