<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAlertContext } from '@/composables/useAlert'
import { useAuthStore } from '@/stores/auth.store'
import { getMyPinnedLocation, getPinnedLocationById, updatePinnedLocation } from '@/services/pinned-locations.service'
import {
  ensureDefaultSiteSections,
  upsertSiteSections,
  listSiteSections,
} from '@/services/site-sections.service'
import { uploadSiteImage } from '@/services/site-storage.service'
import {
  BUSINESS_ROLE_OPTIONS,
  SITE_FONT_PRIMARY_OPTIONS,
  SITE_FONT_SECONDARY_OPTIONS,
  SITE_FONT_TERTIARY_OPTIONS,
  type PinnedLocation,
  type SiteFontPrimary,
  type SiteFontSecondary,
  type SiteFontTertiary,
  type SiteLayoutStyle,
  type SiteSection,
  type SiteThemeColor,
} from '@/types/pinned-location.types'
import {
  SITE_COMPONENT_META,
  SITE_TEMPLATE_PRESETS,
  SITE_THEME_PRESETS,
  SITE_FONT_STACK,
  siteFontStacks,
} from '@/utils/site-design'
import { isCatalogSpaceId } from '@/utils/catalog-spaces.utils'

const authStore = useAuthStore()
const route = useRoute()
const { showAlert, showSuccess } = useAlertContext()

const pin = ref<PinnedLocation | null>(null)
const sections = ref<SiteSection[]>([])
const isLoading = ref(true)
const isSaving = ref(false)

const title = ref('')
const description = ref('')
const themeColor = ref<SiteThemeColor>('ocean')
const layoutStyle = ref<SiteLayoutStyle>('corporate')
const fontPrimary = ref<SiteFontPrimary>('fraunces')
const fontSecondary = ref<SiteFontSecondary>('source_sans')
const fontTertiary = ref<SiteFontTertiary>('jetbrains_mono')
const isPublished = ref(true)

const roleHint = computed(() => {
  const role = authStore.businessRole
  if (role === 'space_owner') return 'Design a site that lists your rentable space.'
  if (role === 'entrepreneur') return 'Design a site that showcases your business.'
  if (role === 'supplier') return 'Design a site that lists your products and supply location.'
  return 'Design your public website linked to your map pin.'
})

const previewStyle = computed(() => {
  if (layoutStyle.value === 'vine') {
    return {
      ...siteFontStacks({
        font_primary: fontPrimary.value || 'playfair',
        font_secondary: fontSecondary.value,
        font_tertiary: fontTertiary.value,
      }),
      '--site-bg': '#140e0c',
      '--site-surface': '#1e1612',
      '--site-ink': '#f4ebe0',
      '--site-accent': '#c4a574',
      background: '#140e0c',
      color: '#f4ebe0',
    } as Record<string, string>
  }

  if (layoutStyle.value === 'nomade') {
    return {
      '--site-font-primary': SITE_FONT_STACK,
      '--site-font-secondary': SITE_FONT_STACK,
      '--site-font-tertiary': SITE_FONT_STACK,
      '--site-bg': '#ffffff',
      '--site-surface': '#ffffff',
      '--site-ink': '#111111',
      '--site-accent': '#111111',
      background: '#ffffff',
      color: '#111111',
    } as Record<string, string>
  }

  if (layoutStyle.value === 'corporate') {
    return {
      ...siteFontStacks({
        font_primary: fontPrimary.value,
        font_secondary: fontSecondary.value,
        font_tertiary: fontTertiary.value,
      }),
      '--site-bg': '#f4f7f2',
      '--site-surface': '#ffffff',
      '--site-ink': '#1c2b24',
      '--site-accent': '#5f8f6b',
      background: '#f4f7f2',
      color: '#1c2b24',
    } as Record<string, string>
  }

  if (layoutStyle.value === 'orbit') {
    return {
      ...siteFontStacks({
        font_primary: fontPrimary.value,
        font_secondary: fontSecondary.value,
        font_tertiary: fontTertiary.value,
      }),
      '--site-bg': '#ffffff',
      '--site-surface': '#ffffff',
      '--site-ink': '#1d1d1f',
      '--site-accent': '#5e5ce6',
      background: '#ffffff',
      color: '#1d1d1f',
    } as Record<string, string>
  }

  if (layoutStyle.value === 'bento') {
    return {
      ...siteFontStacks({
        font_primary: fontPrimary.value,
        font_secondary: fontSecondary.value,
        font_tertiary: fontTertiary.value,
      }),
      '--site-bg': '#0c0c0c',
      '--site-surface': '#161616',
      '--site-ink': '#f5f5f5',
      '--site-accent': '#e8ff47',
      background: '#0c0c0c',
      color: '#f5f5f5',
    } as Record<string, string>
  }

  if (layoutStyle.value === 'signal') {
    return {
      ...siteFontStacks({
        font_primary: fontPrimary.value,
        font_secondary: fontSecondary.value,
        font_tertiary: fontTertiary.value,
      }),
      '--site-bg': '#f3efe6',
      '--site-surface': '#ffffff',
      '--site-ink': '#0f2e1d',
      '--site-accent': '#c8f542',
      background: '#f3efe6',
      color: '#0f2e1d',
    } as Record<string, string>
  }

  const theme = SITE_THEME_PRESETS[themeColor.value] ?? SITE_THEME_PRESETS.ocean!
  return {
    ...siteFontStacks({
      font_primary: fontPrimary.value,
      font_secondary: fontSecondary.value,
      font_tertiary: fontTertiary.value,
    }),
    '--site-bg': theme.bg,
    '--site-surface': theme.surface,
    '--site-ink': theme.ink,
    '--site-accent': theme.accent,
    background: theme.bg,
    color: theme.ink,
  } as Record<string, string>
})

const heroSection = computed(() => sections.value.find((section) => section.section_key === 'hero'))

const previewHeroLines = computed(() => {
  const raw = (heroSection.value?.title || title.value || 'INTIMATE MOMENTS').trim()
  const words = raw.split(/\s+/).filter(Boolean)
  if (words.length <= 1) return [raw.toUpperCase()]
  const lines: string[] = []
  for (let i = 0; i < words.length; i += 2) {
    lines.push(words.slice(i, i + 2).join(' ').toUpperCase())
  }
  return lines.slice(0, 4)
})

const load = async (): Promise<void> => {
  isLoading.value = true
  try {
    const listingId = typeof route.query.listing === 'string' ? route.query.listing : ''
    pin.value = isCatalogSpaceId(listingId)
      ? await getPinnedLocationById(listingId)
      : await getMyPinnedLocation()
    if (!pin.value) {
      return
    }
    title.value = pin.value.title
    description.value = pin.value.description
    themeColor.value = pin.value.theme_color
    layoutStyle.value = pin.value.layout_style
    fontPrimary.value = pin.value.font_primary
    fontSecondary.value = pin.value.font_secondary
    fontTertiary.value = pin.value.font_tertiary
    isPublished.value = pin.value.is_published
    sections.value = isCatalogSpaceId(pin.value.id)
      ? await listSiteSections(pin.value.id)
      : await ensureDefaultSiteSections(pin.value.id)
  } catch (error) {
    showAlert({
      title: 'Unable to load site',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const updateSectionField = (
  sectionKey: SiteSection['section_key'],
  field: 'title' | 'body',
  value: string,
): void => {
  const target = sections.value.find((section) => section.section_key === sectionKey)
  if (target) {
    target[field] = value
  }
}

const onUploadImage = async (
  event: Event,
  sectionKey?: SiteSection['section_key'],
): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !pin.value) {
    return
  }

  try {
    const uploaded = await uploadSiteImage(file)
    if (sectionKey) {
      const target = sections.value.find((section) => section.section_key === sectionKey)
      if (target) {
        target.images = [...target.images, uploaded]
      }
    } else {
      // Newest cover image becomes the featured map-sidebar photo
      pin.value.images = [uploaded, ...pin.value.images]
    }
    showSuccess('Image uploaded.', { title: 'CMS' })
  } catch (error) {
    showAlert({
      title: 'Upload failed',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    input.value = ''
  }
}

const removeSectionImage = (sectionKey: SiteSection['section_key'], index: number): void => {
  const target = sections.value.find((section) => section.section_key === sectionKey)
  if (!target) {
    return
  }
  target.images = target.images.filter((_, i) => i !== index)
}

const removePinImage = (index: number): void => {
  if (!pin.value) {
    return
  }
  pin.value.images = pin.value.images.filter((_, i) => i !== index)
}

const selectTemplate = async (key: SiteLayoutStyle): Promise<void> => {
  layoutStyle.value = key
  if (!pin.value) {
    return
  }

  try {
    pin.value = await updatePinnedLocation(pin.value.id, {
      layout_style: key,
      website_url: `/sites/${pin.value.id}`,
    })
  } catch (error) {
    showAlert({
      title: 'Could not apply template',
      description: error instanceof Error ? error.message : 'Save manually, then open the live site.',
      tone: 'destructive',
    })
  }
}

const save = async (): Promise<boolean> => {
  if (!pin.value) {
    return false
  }

  isSaving.value = true
  try {
    pin.value = await updatePinnedLocation(pin.value.id, {
      title: title.value.trim(),
      description: description.value.trim(),
      theme_color: themeColor.value,
      layout_style: layoutStyle.value,
      font_primary: fontPrimary.value,
      font_secondary: fontSecondary.value,
      font_tertiary: fontTertiary.value,
      images: pin.value.images,
      is_published: isPublished.value,
      website_url: `/sites/${pin.value.id}`,
    })

    sections.value = await upsertSiteSections(
      pin.value.id,
      sections.value.map((section) => ({
        section_key: section.section_key,
        title: section.title,
        body: section.body,
        sort_order: section.sort_order,
        images: section.images,
      })),
    )

    showSuccess('Your website design is saved and linked to your map pin.', { title: 'Saved' })
    return true
  } catch (error) {
    showAlert({
      title: 'Save failed',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
    return false
  } finally {
    isSaving.value = false
  }
}

const openLiveSite = async (): Promise<void> => {
  if (!pin.value) {
    return
  }

  const saved = await save()
  if (!saved || !pin.value) {
    return
  }

  const url = `/sites/${pin.value.id}?v=${Date.now()}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-foreground text-3xl font-semibold">Website designer</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          {{ roleHint }} Pick a template, colors, fonts, and page components — then publish.
        </p>
      </div>
      <div class="flex gap-2">
        <Button v-if="pin" variant="outline" :disabled="isSaving" @click="openLiveSite">
          Open live site
        </Button>
        <Button :disabled="!pin || isSaving" @click="save">Save & publish</Button>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="border-border bg-card text-muted-foreground rounded-2xl border p-8 text-sm"
    >
      Loading your site designer…
    </div>

    <div
      v-else-if="!pin"
      class="border-border bg-card rounded-2xl border border-dashed p-8 text-center"
    >
      <p class="text-foreground text-xl font-semibold">Pin a location first</p>
      <p class="text-muted-foreground mt-2 text-sm">
        Your dynamic website is anchored to a map pin. Add one, then come back to design.
      </p>
      <Button as-child class="mt-4">
        <RouterLink to="/app/map">Go to map</RouterLink>
      </Button>
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
      <div class="space-y-6">
        <section class="border-border bg-card space-y-4 rounded-2xl border p-5">
          <div>
            <h2 class="text-foreground text-lg font-semibold">1. Basics</h2>
            <p class="text-muted-foreground text-sm">Name and short blurb shown on the map card.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="site-title">Business / site name</Label>
              <Input id="site-title" v-model="title" />
            </div>
            <div class="space-y-2">
              <Label>Account type</Label>
              <p class="text-muted-foreground text-sm">
                {{
                  BUSINESS_ROLE_OPTIONS.find((option) => option.value === pin!.role)?.label ??
                  pin!.role
                }}
              </p>
            </div>
            <div class="space-y-2 md:col-span-2">
              <Label for="site-description">Short description</Label>
              <Input id="site-description" v-model="description" />
            </div>
            <div class="flex items-center gap-2 md:col-span-2">
              <input id="published" v-model="isPublished" type="checkbox" class="h-4 w-4" />
              <Label for="published">Published on the public map</Label>
            </div>
          </div>
        </section>

        <section class="border-border bg-card space-y-4 rounded-2xl border p-5">
          <div>
            <h2 class="text-foreground text-lg font-semibold">2. Choose a template</h2>
            <p class="text-muted-foreground text-sm">
              Templates control how sections are arranged on your page.
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="(preset, key) in SITE_TEMPLATE_PRESETS"
              :key="key"
              type="button"
              class="rounded-xl border p-4 text-left transition"
              :class="
                layoutStyle === key
                  ? 'border-primary bg-primary/10 ring-primary/40 ring-2'
                  : 'border-border bg-background hover:bg-muted/60'
              "
              @click="selectTemplate(key as SiteLayoutStyle)"
            >
              <div
                class="mb-3 h-16 overflow-hidden rounded-lg border border-black/5"
                :class="`template-thumb template-thumb-${key}`"
              />
              <p class="text-foreground font-medium">{{ preset.label }}</p>
              <p class="text-muted-foreground mt-1 text-xs">{{ preset.description }}</p>
            </button>
          </div>
        </section>

        <section class="border-border bg-card space-y-4 rounded-2xl border p-5">
          <div>
            <h2 class="text-foreground text-lg font-semibold">3. Pick colors</h2>
            <p class="text-muted-foreground text-sm">
              These colors style your public website only — not the BizNest app chrome.
            </p>
          </div>
          <div class="grid gap-3 md:grid-cols-3">
            <button
              v-for="(preset, key) in SITE_THEME_PRESETS"
              :key="key"
              type="button"
              class="overflow-hidden rounded-xl border text-left transition"
              :class="
                themeColor === key
                  ? 'border-primary ring-primary/40 ring-2'
                  : 'border-border hover:opacity-95'
              "
              @click="themeColor = key as SiteThemeColor"
            >
              <div class="flex h-16">
                <span class="flex-1" :style="{ background: preset.bg }" />
                <span class="flex-1" :style="{ background: preset.surface }" />
                <span class="flex-1" :style="{ background: preset.accent }" />
                <span class="flex-1" :style="{ background: preset.ink }" />
              </div>
              <div class="bg-card p-3">
                <p class="text-foreground font-medium">{{ preset.label }}</p>
                <p class="text-muted-foreground text-xs">{{ preset.description }}</p>
              </div>
            </button>
          </div>
        </section>

        <section class="border-border bg-card space-y-4 rounded-2xl border p-5">
          <div>
            <h2 class="text-foreground text-lg font-semibold">4. Fonts</h2>
            <p class="text-muted-foreground text-sm">
              Primary for headlines, secondary for body, tertiary for labels.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div class="space-y-2">
              <Label>Primary</Label>
              <Select v-model="fontPrimary">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in SITE_FONT_PRIMARY_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Secondary</Label>
              <Select v-model="fontSecondary">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in SITE_FONT_SECONDARY_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Tertiary</Label>
              <Select v-model="fontTertiary">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in SITE_FONT_TERTIARY_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section class="border-border bg-card space-y-4 rounded-2xl border p-5">
          <div>
            <h2 class="text-foreground text-lg font-semibold">5. Page components</h2>
            <p class="text-muted-foreground text-sm">
              Typical website blocks — edit content and images for each.
            </p>
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label>Website cover / hero photos</Label>
            <p class="text-muted-foreground text-xs">
              These appear on your public website only. Map pin photos are uploaded separately on the Map page.
            </p>
            <input type="file" accept="image/*" @change="onUploadImage($event)" />
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="(image, index) in pin.images"
                :key="`${image.url}-${index}`"
                class="relative"
              >
                <img
                  :src="image.url"
                  class="h-20 w-28 rounded-lg object-cover"
                  :class="index === 0 ? 'ring-secondary ring-2' : ''"
                  alt=""
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="absolute top-1 right-1 h-7 px-2 text-xs"
                  @click="removePinImage(index)"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <div
            v-for="section in sections"
            :key="section.id"
            class="border-border bg-background space-y-3 rounded-xl border p-4"
          >
            <div>
              <p class="text-foreground font-medium">
                {{ SITE_COMPONENT_META[section.section_key]?.label ?? section.section_key }}
              </p>
              <p class="text-muted-foreground text-xs">
                {{ SITE_COMPONENT_META[section.section_key]?.hint }}
              </p>
            </div>
            <div class="space-y-2">
              <Label>Heading</Label>
              <Input
                :model-value="section.title"
                @update:model-value="updateSectionField(section.section_key, 'title', String($event))"
              />
            </div>
            <div class="space-y-2">
              <Label>Content</Label>
              <Textarea
                :model-value="section.body"
                :rows="4"
                @update:model-value="updateSectionField(section.section_key, 'body', String($event))"
              />
            </div>
            <div class="space-y-2">
              <Label>Component images</Label>
              <input
                type="file"
                accept="image/*"
                @change="onUploadImage($event, section.section_key)"
              />
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(image, index) in section.images"
                  :key="`${section.section_key}-${index}`"
                  class="relative"
                >
                  <img :src="image.url" class="h-20 w-28 rounded-lg object-cover" alt="" />
                  <button
                    type="button"
                    class="bg-primary/80 text-primary-foreground absolute top-1 right-1 rounded px-1 text-[10px]"
                    @click="removeSectionImage(section.section_key, index)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside class="xl:sticky xl:top-24 xl:self-start">
        <div class="border-border bg-card rounded-2xl border p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <p class="text-foreground font-semibold">Live preview</p>
              <p class="text-muted-foreground text-xs">Updates as you pick templates & colors</p>
            </div>
          </div>

          <!-- Nomad Immersive preview -->
          <div
            v-if="layoutStyle === 'nomade'"
            class="nomade-preview max-h-[70vh] overflow-auto rounded-xl"
            :style="previewStyle"
          >
            <div class="nomade-preview-top">
              <span class="nomade-preview-menu" aria-hidden="true" />
              <span class="nomade-preview-brand">{{ title || 'Your brand' }}</span>
              <span class="nomade-preview-chip">
                {{
                  BUSINESS_ROLE_OPTIONS.find((option) => option.value === pin!.role)?.label ?? 'Biz'
                }}
              </span>
            </div>
            <div class="nomade-preview-hero">
              <img
                v-if="pin?.images?.[0]?.url"
                :src="pin.images[0].url"
                alt="Featured"
                class="nomade-preview-bg"
              />
              <div v-else class="nomade-preview-bg nomade-preview-bg-empty" />
              <div class="nomade-preview-shade" />
              <div class="nomade-preview-copy">
                <h3 class="nomade-preview-title">
                  <span v-for="(line, index) in previewHeroLines" :key="`pl-${index}`">{{
                    line
                  }}</span>
                </h3>
                <p class="nomade-preview-sub">
                  {{ heroSection?.body || description || 'Atmospheric intro over a full-bleed photo.' }}
                </p>
              </div>
              <div class="nomade-preview-ghosts">
                <span>About</span>
                <span>Offerings</span>
                <span>Gallery</span>
                <span>Contact</span>
              </div>
            </div>
            <div
              v-for="section in sections.filter((item) => item.section_key !== 'hero')"
              :key="section.id"
              class="nomade-preview-band"
            >
              <p class="nomade-preview-kicker">{{ section.section_key }}</p>
              <p class="nomade-preview-band-title">{{ section.title }}</p>
              <p class="nomade-preview-band-body">{{ section.body }}</p>
            </div>
          </div>

          <!-- Vine Studio preview -->
          <div
            v-else-if="layoutStyle === 'vine'"
            class="vine-preview max-h-[70vh] overflow-auto rounded-xl"
            :style="previewStyle"
          >
            <div class="vine-preview-nav">
              <span>{{ title || 'Your brand' }}</span>
              <span>About · Offerings · Contact</span>
            </div>
            <div class="vine-preview-hero">
              <div class="vine-preview-copy">
                <p class="preview-kicker">
                  {{
                    BUSINESS_ROLE_OPTIONS.find((option) => option.value === pin!.role)?.label ??
                    'Business'
                  }}
                </p>
                <h3 class="vine-preview-title">
                  {{ heroSection?.title || title || 'Your signature story' }}
                </h3>
                <p class="vine-preview-body">
                  {{ heroSection?.body || description || 'A refined intro for your visitors.' }}
                </p>
                <span class="vine-preview-cta">Get in touch</span>
              </div>
              <div class="vine-preview-visual">
                <div class="vine-preview-glow" />
                <img
                  v-if="pin?.images?.[0]?.url"
                  :src="pin.images[0].url"
                  alt="Featured"
                  class="vine-preview-image"
                />
                <div v-else class="vine-preview-image vine-preview-image-empty">Photo</div>
              </div>
            </div>
            <div class="vine-preview-rail">
              <div
                v-for="section in sections.filter((item) => item.section_key !== 'hero')"
                :key="section.id"
                class="vine-preview-tile"
              >
                <p class="vine-preview-tile-title">{{ section.title }}</p>
                <p class="vine-preview-tile-body">{{ section.body }}</p>
              </div>
            </div>
          </div>

          <!-- Corporate (Nourish Shop) preview -->
          <div
            v-else-if="layoutStyle === 'corporate'"
            class="corporate-preview max-h-[70vh] overflow-auto rounded-xl"
            :style="previewStyle"
          >
            <div class="corporate-preview-nav">
              <span class="corporate-preview-logo">{{ title || 'Your brand' }}</span>
              <span class="corporate-preview-links">About · Offerings · Gallery</span>
              <span class="corporate-preview-cta">Shop now</span>
            </div>
            <div class="corporate-preview-hero">
              <div class="corporate-preview-copy">
                <p class="corporate-preview-kicker">
                  {{
                    BUSINESS_ROLE_OPTIONS.find((option) => option.value === pin!.role)?.label ??
                    'Plant-based wellness'
                  }}
                </p>
                <h3 class="corporate-preview-title">
                  {{ heroSection?.title || title || 'Nourish your everyday ritual' }}
                </h3>
                <p class="corporate-preview-body">
                  {{
                    heroSection?.body ||
                    description ||
                    'Soft sage wellness shop with plant-based picks and calm shopping energy.'
                  }}
                </p>
                <span class="corporate-preview-btn">Shop offerings</span>
              </div>
              <div class="corporate-preview-media">
                <span class="corporate-preview-blob" aria-hidden="true" />
                <img
                  v-if="pin?.images?.[0]?.url"
                  :src="pin.images[0].url"
                  alt="Featured"
                  class="corporate-preview-image"
                />
                <div v-else class="corporate-preview-image corporate-preview-image-empty">Product</div>
              </div>
            </div>
            <div class="corporate-preview-chips">
              <span
                v-for="(chip, index) in [
                  sections.find((item) => item.section_key === 'about')?.title,
                  sections.find((item) => item.section_key === 'services')?.title,
                  sections.find((item) => item.section_key === 'gallery')?.title,
                ]
                  .filter(Boolean)
                  .slice(0, 3)"
                :key="`corp-preview-chip-${index}`"
              >
                {{ chip }}
              </span>
            </div>
            <div
              v-for="section in sections.filter((item) => item.section_key !== 'hero')"
              :key="section.id"
              class="corporate-preview-band"
            >
              <p class="corporate-preview-band-title">{{ section.title }}</p>
              <p class="corporate-preview-band-body">{{ section.body }}</p>
            </div>
          </div>

          <!-- Orbit Showcase preview -->
          <div
            v-else-if="layoutStyle === 'orbit'"
            class="orbit-preview max-h-[70vh] overflow-auto rounded-xl"
            :style="previewStyle"
          >
            <div class="orbit-preview-nav">
              <span>{{ title || 'Brand' }}</span>
              <span>Explore</span>
            </div>
            <div class="orbit-preview-hero">
              <h3 class="orbit-preview-title">
                {{ heroSection?.title || title || 'Hello' }}
              </h3>
              <p class="orbit-preview-body">
                {{ heroSection?.body || description || 'Ultra-minimal white canvas with floating imagery.' }}
              </p>
              <div class="orbit-preview-orbit">
                <img
                  v-if="pin?.images?.[0]?.url"
                  :src="pin.images[0].url"
                  alt="Featured"
                  class="orbit-preview-dot orbit-preview-dot-main"
                />
                <div v-else class="orbit-preview-dot orbit-preview-dot-main orbit-preview-dot-empty" />
                <span class="orbit-preview-dot orbit-preview-dot-a" />
                <span class="orbit-preview-dot orbit-preview-dot-b" />
                <span class="orbit-preview-dot orbit-preview-dot-c" />
              </div>
            </div>
            <div
              v-for="section in sections.filter((item) => item.section_key !== 'hero')"
              :key="section.id"
              class="orbit-preview-band"
            >
              <p class="orbit-preview-band-title">{{ section.title }}</p>
              <p class="orbit-preview-band-body">{{ section.body }}</p>
            </div>
          </div>

          <!-- Bento Dark preview -->
          <div
            v-else-if="layoutStyle === 'bento'"
            class="bento-preview max-h-[70vh] overflow-auto rounded-xl"
            :style="previewStyle"
          >
            <aside class="bento-preview-side">
              <span class="bento-preview-mark">{{ (title || 'BN').slice(0, 2).toUpperCase() }}</span>
              <span>About</span>
              <span>Offer</span>
              <span>Gallery</span>
              <span>Ping</span>
            </aside>
            <div class="bento-preview-main">
              <div class="bento-preview-hero">
                <h3 class="bento-preview-title">
                  {{ heroSection?.title || title || 'Build in the dark' }}
                </h3>
                <p class="bento-preview-body">
                  {{ heroSection?.body || description || 'Neon accents on interlocking cards.' }}
                </p>
              </div>
              <div class="bento-preview-grid">
                <div
                  v-for="section in sections.filter((item) => item.section_key !== 'hero')"
                  :key="section.id"
                  class="bento-preview-card"
                >
                  <p class="bento-preview-card-title">{{ section.title }}</p>
                  <p class="bento-preview-card-body">{{ section.body }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Signal Bold preview -->
          <div
            v-else-if="layoutStyle === 'signal'"
            class="signal-preview max-h-[70vh] overflow-auto rounded-xl"
            :style="previewStyle"
          >
            <div class="signal-preview-nav">
              <span class="signal-preview-logo">{{ title || 'Your brand' }}</span>
              <span class="signal-preview-links">About · Offerings · Contact</span>
            </div>
            <div class="signal-preview-hero">
              <div class="signal-preview-pills">
                <span
                  v-for="(line, index) in previewHeroLines"
                  :key="`sig-${index}`"
                  class="signal-preview-pill"
                  :style="{ '--pill-shift': `${index * 0.55}rem` }"
                  >{{ line }}</span
                >
              </div>
              <p class="signal-preview-body">
                {{ heroSection?.body || description || 'Forest hero with staggered lime headline pills.' }}
              </p>
              <div class="signal-preview-media">
                <img
                  v-if="pin?.images?.[0]?.url"
                  :src="pin.images[0].url"
                  alt="Featured"
                  class="signal-preview-image"
                />
                <div v-else class="signal-preview-image signal-preview-image-empty">Photo</div>
                <div class="signal-preview-widget">
                  <span>Now open</span>
                  <strong>Visit us</strong>
                </div>
              </div>
            </div>
            <div
              v-for="section in sections.filter((item) => item.section_key !== 'hero')"
              :key="section.id"
              class="signal-preview-band"
            >
              <p class="signal-preview-band-title">{{ section.title }}</p>
              <p class="signal-preview-band-body">{{ section.body }}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.preview-kicker {
  font-family: var(--site-font-tertiary);
  color: var(--site-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.65rem;
}

/* Vine Studio live preview */
.vine-preview {
  background:
    radial-gradient(ellipse 55% 45% at 75% 30%, rgba(196, 165, 116, 0.22), transparent 60%),
    #140e0c;
  color: #f4ebe0;
  padding: 0.85rem;
}

.vine-preview-nav {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0.25rem 0.85rem;
  border-bottom: 1px solid rgba(244, 235, 224, 0.08);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.8;
}

.vine-preview-hero {
  display: grid;
  gap: 1rem;
  padding: 1.25rem 0.25rem 1rem;
}

.vine-preview-title {
  font-family: var(--site-font-primary), Georgia, serif;
  font-size: 2.35rem;
  line-height: 0.92;
  letter-spacing: -0.03em;
  max-width: 8ch;
  margin-top: 0.55rem;
  color: #f7f0e6;
}

.vine-preview-body {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  line-height: 1.55;
  color: rgba(244, 235, 224, 0.75);
  max-width: 26ch;
}

.vine-preview-cta {
  display: inline-flex;
  margin-top: 1rem;
  border: 1px solid #c4a574;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #c4a574;
}

.vine-preview-visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 14rem;
}

.vine-preview-glow {
  position: absolute;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(196, 165, 116, 0.35), transparent 70%);
  filter: blur(16px);
}

.vine-preview-image {
  position: relative;
  z-index: 1;
  width: 7.5rem;
  height: 13rem;
  object-fit: cover;
  border-radius: 999px 999px 1rem 1rem;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
}

.vine-preview-image-empty {
  display: grid;
  place-items: center;
  background: rgba(30, 22, 18, 0.9);
  border: 1px dashed rgba(196, 165, 116, 0.35);
  color: rgba(244, 235, 224, 0.45);
  font-size: 0.7rem;
}

.vine-preview-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(8.5rem, 1fr);
  gap: 0.65rem;
  overflow-x: auto;
  padding: 0.25rem 0.15rem 0.5rem;
}

.vine-preview-tile {
  background: #1e1612;
  border: 1px solid rgba(196, 165, 116, 0.16);
  border-radius: 0.9rem;
  padding: 0.75rem;
  min-height: 5.5rem;
}

.vine-preview-tile-title {
  font-family: var(--site-font-primary), Georgia, serif;
  font-size: 0.85rem;
  color: #f7f0e6;
}

.vine-preview-tile-body {
  margin-top: 0.35rem;
  font-size: 0.65rem;
  line-height: 1.4;
  color: rgba(244, 235, 224, 0.65);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 420px) {
  .vine-preview-hero {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: center;
  }
}

.template-thumb {
  background: #e8eef3;
}

.template-thumb-corporate {
  background:
    linear-gradient(#fff, #fff) 0 0 / 100% 16% no-repeat,
    linear-gradient(145deg, #eef5ec, #f4f7f2) 6% 22% / 88% 42% no-repeat,
    radial-gradient(circle at 78% 42%, #f0c9a8 0%, transparent 28%),
    linear-gradient(#fff, #fff) 12% 72% / 18% 12% no-repeat,
    linear-gradient(#fff, #fff) 36% 72% / 18% 12% no-repeat,
    linear-gradient(#fff, #fff) 60% 72% / 18% 12% no-repeat,
    linear-gradient(#5f8f6b, #5f8f6b) 82% 8% / 12% 5% no-repeat,
    #f4f7f2;
}

.template-thumb-orbit {
  background:
    radial-gradient(circle at 72% 58%, #c7b8ff 0%, transparent 28%),
    radial-gradient(circle at 58% 42%, #8ec5ff 0%, transparent 22%),
    radial-gradient(circle at 82% 38%, #ffb4d9 0%, transparent 18%),
    linear-gradient(90deg, #5e5ce6, #ff375f, #ff9f0a) 12% 28% / 48% 10% no-repeat,
    linear-gradient(#e8e8ed, #e8e8ed) 12% 48% / 36% 5% no-repeat,
    #ffffff;
}

.template-thumb-bento {
  background:
    linear-gradient(#161616, #161616) 0 0 / 22% 100% no-repeat,
    linear-gradient(#e8ff47, #e8ff47) 30% 18% / 28% 8% no-repeat,
    linear-gradient(#1f1f1f, #1f1f1f) 28% 34% / 40% 28% no-repeat,
    linear-gradient(#1f1f1f, #1f1f1f) 72% 34% / 22% 28% no-repeat,
    linear-gradient(#1f1f1f, #1f1f1f) 28% 70% / 66% 18% no-repeat,
    #0c0c0c;
}

.template-thumb-signal {
  background:
    linear-gradient(#f3efe6, #f3efe6) 0 0 / 100% 18% no-repeat,
    linear-gradient(#c8f542, #c8f542) 10% 28% / 42% 10% no-repeat,
    linear-gradient(#c8f542, #c8f542) 18% 44% / 36% 10% no-repeat,
    linear-gradient(#1a4d32, #1a4d32) 62% 30% / 28% 36% no-repeat,
    linear-gradient(#0f2e1d, #0f2e1d);
}

.template-thumb-vine {
  background:
    radial-gradient(circle at 72% 42%, rgba(196, 165, 116, 0.55) 0%, transparent 40%),
    linear-gradient(#f4ebe0, #f4ebe0) 10% 24% / 38% 8% no-repeat,
    linear-gradient(#c4a574, #c4a574) 10% 42% / 28% 4% no-repeat,
    linear-gradient(180deg, #2a1c16, #120d0b);
}

.template-thumb-nomade {
  background:
    linear-gradient(#fff, #fff) 0 0 / 100% 18% no-repeat,
    linear-gradient(#111, #111) 8% 8% / 10% 2% no-repeat,
    linear-gradient(#111, #111) 8% 12% / 10% 2% no-repeat,
    linear-gradient(#111, #111) 42% 8% / 16% 3% no-repeat,
    linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)) 12% 42% / 28% 8% no-repeat,
    linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)) 12% 54% / 34% 8% no-repeat,
    linear-gradient(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.55)) 10% 82% / 18% 8% no-repeat,
    linear-gradient(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.55)) 32% 82% / 18% 8% no-repeat,
    linear-gradient(145deg, #5a524c, #1a1614 55%, #3d342e);
}

/* Corporate (Nourish Shop) live preview */
.corporate-preview {
  background: #f4f7f2;
  color: #1c2b24;
  font-family: var(--site-font-secondary);
}

.corporate-preview-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid rgba(28, 43, 36, 0.06);
  background: rgba(255, 255, 255, 0.92);
}

.corporate-preview-logo {
  font-family: var(--site-font-primary);
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: -0.02em;
}

.corporate-preview-links {
  flex: 1;
  font-size: 0.58rem;
  letter-spacing: 0.02em;
  opacity: 0.55;
}

.corporate-preview-cta {
  font-size: 0.55rem;
  font-weight: 600;
  background: #5f8f6b;
  color: #fff;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
}

.corporate-preview-hero {
  display: grid;
  gap: 1rem;
  margin: 0.65rem;
  padding: 1rem 0.85rem;
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at 88% 18%, rgba(240, 201, 168, 0.45) 0%, transparent 34%),
    linear-gradient(145deg, #eef5ec, #f4f7f2 55%, #e8f0e4);
  color: #1c2b24;
}

.corporate-preview-kicker {
  margin: 0;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #5f8f6b;
  font-weight: 700;
}

.corporate-preview-title {
  margin: 0.4rem 0 0;
  font-family: var(--site-font-primary);
  font-size: 1.4rem;
  line-height: 1.08;
  letter-spacing: -0.03em;
  max-width: 12ch;
}

.corporate-preview-body {
  margin: 0.5rem 0 0;
  font-size: 0.7rem;
  line-height: 1.45;
  color: rgba(28, 43, 36, 0.7);
  max-width: 28ch;
}

.corporate-preview-btn {
  display: inline-flex;
  margin-top: 0.75rem;
  background: #5f8f6b;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
}

.corporate-preview-media {
  position: relative;
  min-height: 7rem;
  display: grid;
  place-items: center;
}

.corporate-preview-blob {
  position: absolute;
  width: 78%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(240, 201, 168, 0.7), transparent 55%),
    radial-gradient(circle at 70% 65%, rgba(111, 163, 124, 0.3), transparent 60%);
}

.corporate-preview-image {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 8.5rem;
  object-fit: cover;
  border-radius: 1.15rem;
  background: #fff;
  box-shadow: 0 12px 28px rgba(28, 43, 36, 0.08);
}

.corporate-preview-image-empty {
  display: grid;
  place-items: center;
  color: rgba(28, 43, 36, 0.4);
  font-size: 0.7rem;
}

.corporate-preview-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem 0.75rem;
}

.corporate-preview-chips span {
  font-size: 0.55rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: #fff;
  color: #1c2b24;
  box-shadow: 0 6px 14px rgba(28, 43, 36, 0.05);
}

.corporate-preview-band {
  margin: 0 0.65rem 0.65rem;
  padding: 0.85rem;
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.7);
}

.corporate-preview-band-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
}

.corporate-preview-band-body {
  margin: 0.3rem 0 0;
  font-size: 0.68rem;
  line-height: 1.45;
  color: rgba(28, 43, 36, 0.68);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 420px) {
  .corporate-preview-hero {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: center;
  }
}

/* Orbit Showcase live preview */
.orbit-preview {
  background: #fff;
  color: #1d1d1f;
  font-family: var(--site-font-secondary);
  padding: 0.75rem;
}

.orbit-preview-nav {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0.25rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.7;
}

.orbit-preview-hero {
  position: relative;
  padding: 1.5rem 0.25rem 2rem;
  text-align: center;
  min-height: 16rem;
}

.orbit-preview-title {
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: 2.6rem;
  line-height: 0.92;
  letter-spacing: -0.05em;
  background: linear-gradient(120deg, #5e5ce6 0%, #ff375f 45%, #ff9f0a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.orbit-preview-body {
  margin: 0.85rem auto 0;
  max-width: 28ch;
  font-size: 0.75rem;
  line-height: 1.45;
  color: rgba(29, 29, 31, 0.65);
}

.orbit-preview-orbit {
  position: relative;
  height: 7.5rem;
  margin-top: 1.25rem;
}

.orbit-preview-dot {
  position: absolute;
  border-radius: 50%;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}

.orbit-preview-dot-main {
  left: 50%;
  top: 50%;
  width: 4.2rem;
  height: 4.2rem;
  transform: translate(-50%, -50%);
  object-fit: cover;
  background: #ececf1;
}

.orbit-preview-dot-empty {
  background: linear-gradient(145deg, #dfe3ff, #ffe0ec);
}

.orbit-preview-dot-a {
  width: 1.6rem;
  height: 1.6rem;
  left: 18%;
  top: 18%;
  background: linear-gradient(145deg, #8ec5ff, #5e5ce6);
}

.orbit-preview-dot-b {
  width: 1.15rem;
  height: 1.15rem;
  right: 22%;
  top: 12%;
  background: linear-gradient(145deg, #ffb4d9, #ff375f);
}

.orbit-preview-dot-c {
  width: 1.35rem;
  height: 1.35rem;
  right: 16%;
  bottom: 10%;
  background: linear-gradient(145deg, #ffd59a, #ff9f0a);
}

.orbit-preview-band {
  padding: 0.85rem 0.25rem;
  border-top: 1px solid rgba(29, 29, 31, 0.06);
  text-align: center;
}

.orbit-preview-band-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.orbit-preview-band-body {
  margin: 0.3rem auto 0;
  max-width: 34ch;
  font-size: 0.7rem;
  line-height: 1.45;
  color: rgba(29, 29, 31, 0.65);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Bento Dark live preview */
.bento-preview {
  display: grid;
  grid-template-columns: 3.25rem 1fr;
  min-height: 22rem;
  background: #0c0c0c;
  color: #f5f5f5;
  font-family: var(--site-font-secondary);
}

.bento-preview-side {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.75rem 0.45rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: #111;
  font-size: 0.48rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 245, 245, 0.45);
  writing-mode: horizontal-tb;
}

.bento-preview-mark {
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  margin: 0 auto 0.35rem;
  border-radius: 0.35rem;
  background: #e8ff47;
  color: #0c0c0c;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0;
}

.bento-preview-main {
  padding: 0.75rem;
}

.bento-preview-hero {
  margin-bottom: 0.75rem;
}

.bento-preview-title {
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: 1.45rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #e8ff47;
  max-width: 12ch;
}

.bento-preview-body {
  margin: 0.5rem 0 0;
  font-size: 0.7rem;
  line-height: 1.45;
  color: rgba(245, 245, 245, 0.65);
}

.bento-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.bento-preview-card {
  background: #161616;
  border: 1px solid rgba(232, 255, 71, 0.12);
  border-radius: 0.75rem;
  padding: 0.7rem;
  min-height: 4.5rem;
}

.bento-preview-card:first-child {
  grid-column: 1 / -1;
}

.bento-preview-card-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #e8ff47;
}

.bento-preview-card-body {
  margin: 0.3rem 0 0;
  font-size: 0.62rem;
  line-height: 1.4;
  color: rgba(245, 245, 245, 0.65);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Signal Bold live preview */
.signal-preview {
  background: #f3efe6;
  color: #0f2e1d;
  font-family: var(--site-font-secondary);
}

.signal-preview-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  background: #f3efe6;
  border-bottom: 1px solid rgba(15, 46, 29, 0.08);
}

.signal-preview-logo {
  font-weight: 700;
  font-size: 0.78rem;
}

.signal-preview-links {
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.55;
}

.signal-preview-hero {
  padding: 1.15rem 0.85rem 1.25rem;
  background: #0f2e1d;
  color: #f3efe6;
}

.signal-preview-pills {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.signal-preview-pill {
  display: inline-flex;
  margin-left: var(--pill-shift, 0);
  background: #c8f542;
  color: #0f2e1d;
  font-family: var(--site-font-primary);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
}

.signal-preview-body {
  margin: 0.9rem 0 0;
  max-width: 30ch;
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(243, 239, 230, 0.78);
}

.signal-preview-media {
  position: relative;
  margin-top: 1rem;
}

.signal-preview-image {
  width: 100%;
  height: 8rem;
  object-fit: cover;
  border-radius: 0.85rem;
  background: #1a4d32;
}

.signal-preview-image-empty {
  display: grid;
  place-items: center;
  color: rgba(243, 239, 230, 0.45);
  font-size: 0.7rem;
}

.signal-preview-widget {
  position: absolute;
  right: 0.65rem;
  bottom: 0.65rem;
  display: grid;
  gap: 0.15rem;
  background: #c8f542;
  color: #0f2e1d;
  border-radius: 0.75rem;
  padding: 0.55rem 0.7rem;
  font-size: 0.55rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
}

.signal-preview-widget strong {
  font-size: 0.72rem;
}

.signal-preview-band {
  padding: 0.9rem 0.85rem;
  border-top: 1px solid rgba(15, 46, 29, 0.08);
  background: #f3efe6;
}

.signal-preview-band-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.signal-preview-band-body {
  margin: 0.3rem 0 0;
  font-size: 0.7rem;
  line-height: 1.45;
  color: rgba(15, 46, 29, 0.7);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Nomad live preview */
.nomade-preview {
  background: #fff;
  color: #111;
  font-family: var(--site-font-secondary);
}

.nomade-preview-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.nomade-preview-menu {
  width: 1rem;
  height: 0.7rem;
  background:
    linear-gradient(#111, #111) 0 0 / 100% 1.5px no-repeat,
    linear-gradient(#111, #111) 0 50% / 100% 1.5px no-repeat,
    linear-gradient(#111, #111) 0 100% / 100% 1.5px no-repeat;
}

.nomade-preview-brand {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.nomade-preview-chip {
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.4rem;
}

.nomade-preview-hero {
  position: relative;
  min-height: 18rem;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.nomade-preview-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nomade-preview-bg-empty {
  background: linear-gradient(145deg, #3a3a3a, #151515);
}

.nomade-preview-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.55));
}

.nomade-preview-copy {
  position: relative;
  z-index: 1;
  padding: 1.25rem 1rem 0.75rem;
}

.nomade-preview-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  font-size: 1.55rem;
  line-height: 0.95;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.nomade-preview-sub {
  margin: 0.65rem 0 0;
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.85);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nomade-preview-ghosts {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0 1rem 1rem;
}

.nomade-preview-ghosts span {
  border: 1px solid rgba(255, 255, 255, 0.85);
  padding: 0.35rem 0.55rem;
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.nomade-preview-band {
  padding: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.nomade-preview-kicker {
  margin: 0;
  font-size: 0.55rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.45);
}

.nomade-preview-band-title {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.nomade-preview-band-body {
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(17, 17, 17, 0.7);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
