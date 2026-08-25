<script setup lang="ts">
import { Settings, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TypographyMuted, TypographyP, TypographySmall } from '@/components/typography'
import { useAdminMapStore } from '@/stores/admin.map.store'
import type { MapLightAnchor, MapProjectionType, MapSpacePreset } from '@/types/map.types'

const adminMapStore = useAdminMapStore()

const PROJECTION_OPTIONS: Array<{ value: MapProjectionType; label: string }> = [
  { value: 'mercator', label: 'Mercator' },
  { value: 'globe', label: 'Globe' },
]

const SPACE_PRESET_OPTIONS: Array<{ value: MapSpacePreset; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'space', label: 'Space' },
  { value: 'stars', label: 'Stars' },
  { value: 'milky-way', label: 'Milky Way' },
  { value: 'subtle-milky-way', label: 'Subtle Milky Way' },
  { value: 'bright-milky-way', label: 'Bright Milky Way' },
  { value: 'colored-milky-way', label: 'Colored Milky Way' },
]

const LIGHT_ANCHOR_OPTIONS: Array<{ value: MapLightAnchor; label: string }> = [
  { value: 'map', label: 'Map' },
  { value: 'viewport', label: 'Viewport' },
]

function close(): void {
  adminMapStore.activePanel = null
}

function onLightPositionInput(index: 0 | 1 | 2, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) {
    adminMapStore.setLightPositionComponent(index, value)
  }
}
</script>

<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l">
    <Card class="flex h-full flex-col rounded-none border-0 shadow-none py-0">
      <CardHeader class="shrink-0 border-b py-4">
        <CardTitle class="flex items-center justify-between text-base">
          <div class="flex items-center gap-2">
            <Settings class="h-4 w-4 text-muted-foreground" />
            <TypographyP as="span" class="m-0 leading-none">Map Settings</TypographyP>
          </div>

          <Button variant="ghost" size="icon-sm" @click="close">
            <X class="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent class="flex-1 space-y-5 overflow-y-auto p-4">
        <!-- ── Projection ─────────────────────────────────────────────── -->
        <section class="space-y-2">
          <TypographySmall as="p" class="text-xs font-semibold text-foreground">Projection</TypographySmall>

          <div class="space-y-1">
            <TypographyMuted as="p" class="text-xs">Type</TypographyMuted>
            <Select
              :model-value="adminMapStore.mapSettings.projection"
              @update:model-value="(value) => adminMapStore.setProjectionType(value as MapProjectionType)"
            >
              <SelectTrigger size="sm" class="w-full">
                <SelectValue placeholder="Projection type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in PROJECTION_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <div class="border-t" />

        <!-- ── Space ──────────────────────────────────────────────────── -->
        <section class="space-y-2">
          <TypographySmall as="p" class="text-xs font-semibold text-foreground">Space</TypographySmall>

          <div class="space-y-1">
            <TypographyMuted as="p" class="text-xs">Space Color</TypographyMuted>
            <Select
              :model-value="adminMapStore.mapSettings.space.preset"
              @update:model-value="(value) => adminMapStore.setSpacePreset(value as MapSpacePreset)"
            >
              <SelectTrigger size="sm" class="w-full">
                <SelectValue placeholder="Space color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in SPACE_PRESET_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex items-center justify-between gap-2">
            <TypographyMuted as="p" class="text-xs">Halo Color</TypographyMuted>
            <input
              type="color"
              class="h-7 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              :value="adminMapStore.mapSettings.space.haloColor"
              @input="adminMapStore.setHaloColor(($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <TypographyMuted as="p" class="text-xs">Halo Opacity</TypographyMuted>
              <TypographyMuted as="p" class="text-xs tabular-nums">
                {{ adminMapStore.mapSettings.space.haloOpacity.toFixed(2) }}
              </TypographyMuted>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="w-full"
              :value="adminMapStore.mapSettings.space.haloOpacity"
              @input="adminMapStore.setHaloOpacity(Number(($event.target as HTMLInputElement).value))"
            >
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <TypographyMuted as="p" class="text-xs">Halo Scale</TypographyMuted>
              <TypographyMuted as="p" class="text-xs tabular-nums">
                {{ adminMapStore.mapSettings.space.haloScale.toFixed(2) }}
              </TypographyMuted>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              class="w-full"
              :value="adminMapStore.mapSettings.space.haloScale"
              @input="adminMapStore.setHaloScale(Number(($event.target as HTMLInputElement).value))"
            >
          </div>
        </section>

        <div class="border-t" />

        <!-- ── 3D ─────────────────────────────────────────────────────── -->
        <section class="space-y-3">
          <TypographySmall as="p" class="text-xs font-semibold text-foreground">3D</TypographySmall>

          <label class="flex items-center gap-2">
            <Checkbox
              :model-value="adminMapStore.mapSettings.terrainEnabled"
              @update:model-value="(value) => adminMapStore.setTerrainEnabled(!!value)"
            />
            <TypographySmall as="span" class="text-sm">Terrain</TypographySmall>
          </label>

          <TypographyMuted as="p" class="text-xs font-medium">Global Light</TypographyMuted>

          <div class="space-y-1">
            <TypographyMuted as="p" class="text-xs">Anchor</TypographyMuted>
            <Select
              :model-value="adminMapStore.mapSettings.light.anchor"
              @update:model-value="(value) => adminMapStore.setLightAnchor(value as MapLightAnchor)"
            >
              <SelectTrigger size="sm" class="w-full">
                <SelectValue placeholder="Light anchor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in LIGHT_ANCHOR_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex items-center justify-between gap-2">
            <TypographyMuted as="p" class="text-xs">Color</TypographyMuted>
            <input
              type="color"
              class="h-7 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              :value="adminMapStore.mapSettings.light.color"
              @input="adminMapStore.setLightColor(($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="space-y-1">
            <TypographyMuted as="p" class="text-xs">
              Position (radial, azimuthal°, polar°)
            </TypographyMuted>
            <div class="grid grid-cols-3 gap-1">
              <input
                type="number"
                step="0.05"
                class="w-full rounded border bg-transparent px-1.5 py-1 text-xs"
                :value="adminMapStore.mapSettings.light.position[0]"
                @input="onLightPositionInput(0, $event)"
              >
              <input
                type="number"
                step="1"
                class="w-full rounded border bg-transparent px-1.5 py-1 text-xs"
                :value="adminMapStore.mapSettings.light.position[1]"
                @input="onLightPositionInput(1, $event)"
              >
              <input
                type="number"
                step="1"
                class="w-full rounded border bg-transparent px-1.5 py-1 text-xs"
                :value="adminMapStore.mapSettings.light.position[2]"
                @input="onLightPositionInput(2, $event)"
              >
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <TypographyMuted as="p" class="text-xs">Intensity</TypographyMuted>
              <TypographyMuted as="p" class="text-xs tabular-nums">
                {{ adminMapStore.mapSettings.light.intensity.toFixed(2) }}
              </TypographyMuted>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="w-full"
              :value="adminMapStore.mapSettings.light.intensity"
              @input="adminMapStore.setLightIntensity(Number(($event.target as HTMLInputElement).value))"
            >
          </div>
        </section>

        <div class="border-t" />

        <!-- ── Sky ────────────────────────────────────────────────────── -->
        <section class="space-y-2">
          <TypographySmall as="p" class="text-xs font-semibold text-foreground">Sky</TypographySmall>

          <div class="flex items-center justify-between gap-2">
            <TypographyMuted as="p" class="text-xs">Sky Color</TypographyMuted>
            <input
              type="color"
              class="h-7 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              :value="adminMapStore.mapSettings.sky.skyColor"
              @input="adminMapStore.setSkyColor(($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="flex items-center justify-between gap-2">
            <TypographyMuted as="p" class="text-xs">Horizon Color</TypographyMuted>
            <input
              type="color"
              class="h-7 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              :value="adminMapStore.mapSettings.sky.horizonColor"
              @input="adminMapStore.setHorizonColor(($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="flex items-center justify-between gap-2">
            <TypographyMuted as="p" class="text-xs">Fog Color</TypographyMuted>
            <input
              type="color"
              class="h-7 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              :value="adminMapStore.mapSettings.sky.fogColor"
              @input="adminMapStore.setFogColor(($event.target as HTMLInputElement).value)"
            >
          </div>
        </section>
      </CardContent>
    </Card>
  </aside>
</template>
