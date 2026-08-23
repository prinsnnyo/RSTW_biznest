<script setup lang="ts">
import { Building2, FileText, Globe, Layers, MapPin, TriangleAlert } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAdminMapStore } from '@/stores/admin.map.store'
import ZoningPanel from '@/views/(admin)/map/components/panels/ZoningPanel.vue'
import HazardPanel from '@/views/(admin)/map/components/panels/HazardPanel.vue'
import LocalBusinessPanel from '@/views/(admin)/map/components/panels/LocalBusinessPanel.vue'
import ReportsPanel from '@/views/(admin)/map/components/panels/ReportsPanel.vue'
import POIPanel from '@/views/(admin)/map/components/panels/POIPanel.vue'

defineProps<{
  visible: boolean
}>()

const adminMapStore = useAdminMapStore()
</script>

<template>
  <div v-if="visible" class="contents">
    <!-- ── Panel dock (left of the icon strip) ──────────────────────── -->
    <div v-if="adminMapStore.activePanel" class="absolute inset-y-0 right-11 z-1000">
      <ZoningPanel v-if="adminMapStore.activePanel === 'zoning'" />
      <HazardPanel v-else-if="adminMapStore.activePanel === 'hazard'" />
      <LocalBusinessPanel v-else-if="adminMapStore.activePanel === 'local-business'" />
      <ReportsPanel v-else-if="adminMapStore.activePanel === 'reports'" />
      <POIPanel v-else-if="adminMapStore.activePanel === 'poi'" />
    </div>

    <!-- ── Vertical icon strip ──────────────────────────────────────── -->
    <div
      class="absolute inset-y-0 right-0 z-1001 flex w-11 shrink-0 flex-col border-l bg-card"
    >
      <TooltipProvider :delay-duration="300">
        <!-- Zoning -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
              :class="
                adminMapStore.activePanel === 'zoning'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              "
              @click="adminMapStore.togglePanel('zoning')"
            >
              <Layers class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoning</TooltipContent>
        </Tooltip>

        <div class="h-px bg-border" />

        <!-- Hazards -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
              :class="
                adminMapStore.activePanel === 'hazard'
                  ? 'bg-muted text-amber-500'
                  : 'text-muted-foreground'
              "
              @click="adminMapStore.togglePanel('hazard')"
            >
              <TriangleAlert class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Hazards</TooltipContent>
        </Tooltip>

        <div class="h-px bg-border" />

        <!-- Local Business -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
              :class="
                adminMapStore.activePanel === 'local-business'
                  ? 'bg-muted text-emerald-500'
                  : 'text-muted-foreground'
              "
              @click="adminMapStore.togglePanel('local-business')"
            >
              <Building2 class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Local Business</TooltipContent>
        </Tooltip>

        <div class="h-px bg-border" />

        <!-- Reports -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
              :class="
                adminMapStore.activePanel === 'reports'
                  ? 'bg-muted text-sky-500'
                  : 'text-muted-foreground'
              "
              @click="adminMapStore.togglePanel('reports')"
            >
              <FileText class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Reports</TooltipContent>
        </Tooltip>

        <div class="h-px bg-border" />

        <!-- Barangay borders (toggle-only, no panel) -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                adminMapStore.showBarangayBorders ? 'bg-muted text-foreground' : 'text-muted-foreground'
              "
              :disabled="adminMapStore.isLoading"
              @click="adminMapStore.toggleBarangayBorders"
            >
              <Globe class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {{ adminMapStore.showBarangayBorders ? 'Hide Barangay Borders' : 'Show Barangay Borders' }}
          </TooltipContent>
        </Tooltip>

        <div class="h-px bg-border" />

        <!-- POI -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-11 w-full items-center justify-center transition-colors hover:bg-muted"
              :class="
                adminMapStore.activePanel === 'poi'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              "
              @click="adminMapStore.togglePanel('poi')"
            >
              <MapPin class="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Map Labels</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</template>
