<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAlertContext } from '@/composables/useAlert'
import { useAuthStore } from '@/stores/auth.store'
import { createContactMessage } from '@/services/contact-messages.service'
import { getPinnedLocationById } from '@/services/pinned-locations.service'
import { listSiteSections } from '@/services/site-sections.service'
import { isCatalogSpaceId } from '@/utils/catalog-spaces.utils'
import {
  BUSINESS_ROLE_OPTIONS,
  type PinnedLocation,
  type SiteSection,
} from '@/types/pinned-location.types'
import { siteFontStacks, SITE_FONT_STACK } from '@/utils/site-design'

const route = useRoute()
const authStore = useAuthStore()
const { showAlert, showSuccess } = useAlertContext()

const pin = ref<PinnedLocation | null>(null)
const sections = ref<SiteSection[]>([])
const isLoading = ref(true)
const isSending = ref(false)

const senderName = ref('')
const senderEmail = ref('')
const message = ref('')

const layoutStyle = computed(() => pin.value?.layout_style ?? 'corporate')
const isCorporate = computed(() => layoutStyle.value === 'corporate')
const isOrbit = computed(() => layoutStyle.value === 'orbit')
const isBento = computed(() => layoutStyle.value === 'bento')
const isSignal = computed(() => layoutStyle.value === 'signal')
const isVine = computed(() => layoutStyle.value === 'vine')
const isNomade = computed(() => layoutStyle.value === 'nomade')
const layoutClass = computed(() => `site-layout-${layoutStyle.value}`)

const designStyle = computed(() => {
  if (isVine.value) {
    return {
      ...siteFontStacks({
        font_primary: pin.value?.font_primary ?? 'playfair',
        font_secondary: pin.value?.font_secondary ?? 'source_sans',
        font_tertiary: pin.value?.font_tertiary ?? 'jetbrains_mono',
      }),
      '--site-bg': '#140e0c',
      '--site-surface': '#1e1612',
      '--site-ink': '#f4ebe0',
      '--site-accent': '#c4a574',
      background: '#140e0c',
    } as Record<string, string>
  }

  if (isNomade.value) {
    return {
      '--site-font-primary': SITE_FONT_STACK,
      '--site-font-secondary': SITE_FONT_STACK,
      '--site-font-tertiary': SITE_FONT_STACK,
      '--site-bg': '#ffffff',
      '--site-surface': '#ffffff',
      '--site-ink': '#111111',
      '--site-accent': '#111111',
      background: '#ffffff',
    } as Record<string, string>
  }

  if (isCorporate.value) {
    return {
      '--site-font-primary': SITE_FONT_STACK,
      '--site-font-secondary': SITE_FONT_STACK,
      '--site-font-tertiary': SITE_FONT_STACK,
      '--site-bg': '#f4f7f2',
      '--site-surface': '#ffffff',
      '--site-ink': '#1c2b24',
      '--site-accent': '#5f8f6b',
      '--corp-sage': '#5f8f6b',
      '--corp-sage-soft': '#6fa37c',
      '--corp-peach': '#f0c9a8',
      '--corp-mint': '#eef5ec',
      '--corp-ink': '#1c2b24',
      background: '#f4f7f2',
    } as Record<string, string>
  }

  if (isOrbit.value) {
    return {
      '--site-font-primary': SITE_FONT_STACK,
      '--site-font-secondary': SITE_FONT_STACK,
      '--site-font-tertiary': SITE_FONT_STACK,
      '--site-bg': '#ffffff',
      '--site-surface': '#ffffff',
      '--site-ink': '#1d1d1f',
      '--site-accent': '#5ac8fa',
      '--orbit-magenta': '#ff2d95',
      '--orbit-cyan': '#5ac8fa',
      background: '#ffffff',
    } as Record<string, string>
  }

  if (isBento.value) {
    return {
      '--site-font-primary': SITE_FONT_STACK,
      '--site-font-secondary': SITE_FONT_STACK,
      '--site-font-tertiary': SITE_FONT_STACK,
      '--site-bg': '#0d0d0d',
      '--site-surface': '#1a1a1a',
      '--site-ink': '#ffffff',
      '--site-accent': '#ccff00',
      '--bento-neon': '#ccff00',
      '--bento-charcoal': '#0d0d0d',
      '--bento-panel': '#1a1a1a',
      background: '#0d0d0d',
    } as Record<string, string>
  }

  if (isSignal.value) {
    return {
      '--site-font-primary': SITE_FONT_STACK,
      '--site-font-secondary': SITE_FONT_STACK,
      '--site-font-tertiary': SITE_FONT_STACK,
      '--site-bg': '#f4f1ea',
      '--site-surface': '#faf8f4',
      '--site-ink': '#1a3c34',
      '--site-accent': '#c8f135',
      '--signal-cream': '#f4f1ea',
      '--signal-forest': '#1a3c34',
      '--signal-lime': '#c8f135',
      background: '#f4f1ea',
    } as Record<string, string>
  }

  return {
    '--site-font-primary': SITE_FONT_STACK,
    '--site-font-secondary': SITE_FONT_STACK,
    '--site-font-tertiary': SITE_FONT_STACK,
    '--site-bg': '#ffffff',
    '--site-surface': '#ffffff',
    '--site-ink': '#1a2456',
    '--site-accent': '#5ec4c0',
    background: '#ffffff',
  } as Record<string, string>
})

const roleLabel = computed(() => {
  if (!pin.value) return ''
  return BUSINESS_ROLE_OPTIONS.find((option) => option.value === pin.value?.role)?.label ?? ''
})

const canEditThisSite = computed(
  () =>
    Boolean(pin.value) &&
    authStore.isBusinessUser &&
    (isCatalogSpaceId(pin.value?.id ?? '') || pin.value?.user_id === authStore.user?.id),
)

const editSitePath = computed(() => {
  if (!pin.value) {
    return '/app/my-site'
  }
  if (isCatalogSpaceId(pin.value.id)) {
    return `/app/my-site?listing=${encodeURIComponent(pin.value.id)}`
  }
  return '/app/my-site'
})

const sectionByKey = (key: SiteSection['section_key']): SiteSection | undefined =>
  sections.value.find((section) => section.section_key === key)

const contentSections = computed(() =>
  sections.value.filter((item) => item.section_key !== 'hero' && item.section_key !== 'contact'),
)

const featuredImage = computed(() => pin.value?.images?.[0] ?? null)

const heroHeadlineLines = computed(() => {
  const raw = (sectionByKey('hero')?.title || pin.value?.title || 'INTIMATE MOMENTS').trim()
  const words = raw.split(/\s+/).filter(Boolean)
  if (words.length <= 1) {
    return [raw.toUpperCase()]
  }
  const lines: string[] = []
  for (let i = 0; i < words.length; i += 2) {
    const chunk = words.slice(i, i + 2).join(' ')
    lines.push(chunk.toUpperCase())
  }
  return lines.slice(0, 4)
})

const signalHeadlinePills = computed(() => heroHeadlineLines.value)

const corporateCategoryChips = computed(() => {
  const chips: { id: string; label: string }[] = []
  const candidates: Array<{ id: string; label?: string }> = [
    { id: 'about', label: sectionByKey('about')?.title },
    { id: 'services', label: sectionByKey('services')?.title },
    { id: 'gallery', label: sectionByKey('gallery')?.title },
    { id: 'about', label: roleLabel.value },
  ]
  for (const candidate of candidates) {
    const label = (candidate.label ?? '').trim()
    if (!label || chips.some((chip) => chip.label === label)) continue
    chips.push({ id: candidate.id, label })
  }
  return chips
})

const orbitFloatImages = computed(() => {
  const images = [
    featuredImage.value,
    ...galleryImages.value,
  ].filter((img): img is NonNullable<typeof img> => Boolean(img?.url))
  return images.slice(0, 5)
})

const nomadeGhostButtons = computed(() => [
  { id: 'about', label: sectionByKey('about')?.title || 'About' },
  { id: 'services', label: sectionByKey('services')?.title || 'Offerings' },
  { id: 'gallery', label: sectionByKey('gallery')?.title || 'Gallery' },
  { id: 'contact', label: 'Get in touch' },
])

const brandMonogram = computed(() => {
  const raw = (pin.value?.title ?? 'BIZ').replace(/[^a-zA-Z0-9]/g, ' ').trim()
  const words = raw.split(/\s+/).filter(Boolean)
  const letters =
    words.length >= 2
      ? words.map((word) => word[0] ?? '').join('')
      : raw.replace(/\s/g, '')
  return letters.slice(0, 4).toUpperCase().padEnd(4, '·').split('')
})

const galleryImages = computed(() => {
  const fromGallery = sectionByKey('gallery')?.images ?? []
  if (fromGallery.length > 0) return fromGallery
  return pin.value?.images?.slice(1) ?? []
})

const corporateFeaturedPicks = computed(() => {
  const servicesImages = sectionByKey('services')?.images ?? []
  const source = servicesImages.length > 0 ? servicesImages : galleryImages.value
  const bodySource =
    sectionByKey('services')?.body ||
    sectionByKey('about')?.body ||
    pin.value?.description ||
    'Plant-based picks for everyday wellness.'
  const snippet =
    bodySource.trim().length > 96
      ? `${bodySource.trim().slice(0, 96).trimEnd()}…`
      : bodySource.trim()
  return source.slice(0, 6).map((image, index) => ({
    url: image.url,
    title: (image.alt || '').trim() || `Pick ${index + 1}`,
    body: snippet,
  }))
})

const scrollToSection = (id: string): void => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const load = async (): Promise<void> => {
  const id = String(route.params.id || '')
  if (!id) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    pin.value = await getPinnedLocationById(id)
    if (pin.value) {
      sections.value = await listSiteSections(pin.value.id)
    }
  } catch (error) {
    showAlert({
      title: 'Site unavailable',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const submitContact = async (): Promise<void> => {
  if (!pin.value) {
    return
  }

  if (!senderName.value.trim() || !senderEmail.value.trim() || !message.value.trim()) {
    showAlert({
      title: 'Missing fields',
      description: 'Name, email, and message are required.',
      tone: 'destructive',
    })
    return
  }

  if (isCatalogSpaceId(pin.value.id)) {
    showAlert({
      title: 'Edit this listing in My Site',
      description: 'Open My Site from the banner above to update this space website.',
    })
    return
  }

  isSending.value = true
  try {
    await createContactMessage({
      pinned_location_id: pin.value.id,
      sender_name: senderName.value,
      sender_email: senderEmail.value,
      message: message.value,
    })
    senderName.value = ''
    senderEmail.value = ''
    message.value = ''
    showSuccess('Your message was sent.', { title: 'Thank you' })
  } catch (error) {
    showAlert({
      title: 'Could not send',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isSending.value = false
  }
}

onMounted(() => {
  void load()
})

watch(
  () => route.params.id,
  () => {
    void load()
  },
)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <div
      v-if="!isLoading && pin && canEditThisSite"
      class="bg-card text-foreground border-border sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-4 py-2 text-sm"
    >
      <span>This website is editable.</span>
      <RouterLink class="text-primary font-medium underline" :to="editSitePath">Edit in My Site</RouterLink>
    </div>
    <div v-if="isLoading" class="text-muted-foreground p-10 text-center text-sm">Loading site…</div>
    <div v-else-if="!pin" class="text-muted-foreground p-10 text-center text-sm">Site not found.</div>

    <!-- Corporate (Nourish Shop) -->
    <article
      v-else-if="isCorporate"
      class="site-root site-layout-corporate min-h-screen"
      :style="designStyle"
    >
      <nav class="corp-nav">
        <p class="corp-brand">{{ pin.title }}</p>
        <div class="corp-nav-links">
          <button type="button" @click="scrollToSection('about')">About</button>
          <button type="button" @click="scrollToSection('services')">Offerings</button>
          <button type="button" @click="scrollToSection('gallery')">Gallery</button>
        </div>
        <button type="button" class="corp-nav-cta" @click="scrollToSection('contact')">
          Shop now
        </button>
      </nav>

      <header class="corp-hero">
        <div class="corp-hero-panel">
          <div class="corp-hero-copy">
            <p class="corp-kicker">{{ roleLabel || 'Plant-based wellness' }}</p>
            <h1 class="corp-hero-title">
              {{ sectionByKey('hero')?.title || pin.title }}
            </h1>
            <p class="corp-hero-sub">
              {{ sectionByKey('hero')?.body || pin.description }}
            </p>
            <div class="corp-hero-actions">
              <button type="button" class="corp-btn-primary" @click="scrollToSection('services')">
                Shop offerings
              </button>
              <button type="button" class="corp-btn-ghost" @click="scrollToSection('contact')">
                Contact
              </button>
            </div>
          </div>
          <div class="corp-hero-media">
            <span class="corp-hero-blob" aria-hidden="true" />
            <div class="corp-hero-card">
              <img
                v-if="featuredImage?.url"
                :src="featuredImage.url"
                :alt="featuredImage.alt || pin.title"
                class="corp-hero-image"
              />
              <div v-else class="corp-hero-placeholder">Featured image</div>
            </div>
          </div>
        </div>
      </header>

      <div v-if="corporateCategoryChips.length" class="corp-chips">
        <button
          v-for="chip in corporateCategoryChips"
          :key="`chip-${chip.id}-${chip.label}`"
          type="button"
          class="corp-chip"
          @click="scrollToSection(chip.id)"
        >
          {{ chip.label }}
        </button>
      </div>

      <section
        v-if="corporateFeaturedPicks.length"
        class="corp-section corp-featured"
        aria-label="Featured picks"
      >
        <p class="corp-kicker">Shop</p>
        <h2 class="corp-heading">Featured picks</h2>
        <div class="corp-products">
          <article
            v-for="(pick, index) in corporateFeaturedPicks"
            :key="`corp-pick-${index}`"
            class="corp-product"
          >
            <img :src="pick.url" :alt="pick.title" class="corp-product-image" />
            <div class="corp-product-copy">
              <h3 class="corp-product-title">{{ pick.title }}</h3>
              <p class="corp-product-body">{{ pick.body }}</p>
            </div>
          </article>
        </div>
      </section>

      <section v-if="sectionByKey('about')" id="about" class="corp-section corp-soft">
        <p class="corp-kicker">About</p>
        <h2 class="corp-heading">{{ sectionByKey('about')?.title }}</h2>
        <p class="corp-body">{{ sectionByKey('about')?.body }}</p>
      </section>

      <section v-if="sectionByKey('services')" id="services" class="corp-section corp-soft">
        <p class="corp-kicker">Offerings</p>
        <h2 class="corp-heading">{{ sectionByKey('services')?.title }}</h2>
        <p class="corp-body">{{ sectionByKey('services')?.body }}</p>
      </section>

      <section id="gallery" class="corp-section">
        <p class="corp-kicker">Gallery</p>
        <h2 class="corp-heading">{{ sectionByKey('gallery')?.title || 'Gallery' }}</h2>
        <div class="corp-gallery">
          <img
            v-for="(image, index) in galleryImages"
            :key="`corp-g-${index}`"
            :src="image.url"
            :alt="image.alt || `Gallery ${index + 1}`"
          />
          <p v-if="galleryImages.length === 0" class="corp-body">
            Upload gallery images in the site designer.
          </p>
        </div>
      </section>

      <section id="contact" class="corp-section corp-contact">
        <div class="corp-contact-card">
          <p class="corp-kicker">Contact</p>
          <h2 class="corp-heading">{{ sectionByKey('contact')?.title || 'Get in touch' }}</h2>
          <p class="corp-body">
            {{ sectionByKey('contact')?.body || 'Send a message and we will get back to you.' }}
          </p>
          <form class="corp-form" @submit.prevent="submitContact">
            <div class="space-y-1">
              <Label for="contact-name-corporate">Name</Label>
              <Input id="contact-name-corporate" v-model="senderName" required />
            </div>
            <div class="space-y-1">
              <Label for="contact-email-corporate">Email</Label>
              <Input id="contact-email-corporate" v-model="senderEmail" type="email" required />
            </div>
            <div class="space-y-1">
              <Label for="contact-message-corporate">Message</Label>
              <Textarea id="contact-message-corporate" v-model="message" :rows="4" required />
            </div>
            <button type="submit" class="corp-nav-cta corp-submit" :disabled="isSending">
              Send message
            </button>
          </form>
        </div>
      </section>
    </article>

    <!-- Orbit Showcase (Apple Siri-style) -->
    <article
      v-else-if="isOrbit"
      class="site-root site-layout-orbit min-h-screen"
      :style="designStyle"
    >
      <nav class="orbit-nav">
        <p class="orbit-brand">{{ pin.title }}</p>
        <div class="orbit-nav-links">
          <button type="button" @click="scrollToSection('about')">About</button>
          <button type="button" @click="scrollToSection('services')">Offerings</button>
          <button type="button" @click="scrollToSection('gallery')">Gallery</button>
          <button type="button" @click="scrollToSection('contact')">Contact</button>
        </div>
      </nav>

      <header class="orbit-hero">
        <div class="orbit-float-stage" aria-hidden="true">
          <template v-if="orbitFloatImages.length">
            <img
              v-for="(image, index) in orbitFloatImages"
              :key="`orbit-float-${index}`"
              :src="image.url"
              :alt="''"
              class="orbit-float"
              :class="`orbit-float-${index + 1}`"
            />
          </template>
          <template v-else>
            <div
              v-for="n in 4"
              :key="`orbit-ph-${n}`"
              class="orbit-float orbit-float-ph"
              :class="`orbit-float-${n}`"
            />
          </template>
        </div>
        <h1 class="orbit-title">
          {{ sectionByKey('hero')?.title || pin.title }}
        </h1>
        <p class="orbit-sub">
          {{ sectionByKey('hero')?.body || pin.description }}
        </p>
      </header>

      <section v-if="sectionByKey('about')" id="about" class="orbit-section">
        <p class="orbit-kicker">About</p>
        <h2 class="orbit-heading">{{ sectionByKey('about')?.title }}</h2>
        <p class="orbit-body">{{ sectionByKey('about')?.body }}</p>
      </section>

      <section v-if="sectionByKey('services')" id="services" class="orbit-section">
        <p class="orbit-kicker">Offerings</p>
        <h2 class="orbit-heading">{{ sectionByKey('services')?.title }}</h2>
        <p class="orbit-body">{{ sectionByKey('services')?.body }}</p>
      </section>

      <section id="gallery" class="orbit-section">
        <p class="orbit-kicker">Gallery</p>
        <h2 class="orbit-heading">{{ sectionByKey('gallery')?.title || 'Gallery' }}</h2>
        <div class="orbit-gallery-strip">
          <img
            v-for="(image, index) in galleryImages"
            :key="`orbit-g-${index}`"
            :src="image.url"
            :alt="image.alt || `Gallery ${index + 1}`"
          />
          <p v-if="galleryImages.length === 0" class="orbit-body">
            Upload gallery images in the site designer.
          </p>
        </div>
      </section>

      <section id="contact" class="orbit-section orbit-contact">
        <p class="orbit-kicker">Contact</p>
        <h2 class="orbit-heading">{{ sectionByKey('contact')?.title || 'Say hello' }}</h2>
        <p class="orbit-body">
          {{ sectionByKey('contact')?.body || 'Send a message and we will get back to you.' }}
        </p>
        <form class="orbit-form" @submit.prevent="submitContact">
          <div class="space-y-1">
            <Label for="contact-name-orbit">Name</Label>
            <Input id="contact-name-orbit" v-model="senderName" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-email-orbit">Email</Label>
            <Input id="contact-email-orbit" v-model="senderEmail" type="email" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-message-orbit">Message</Label>
            <Textarea id="contact-message-orbit" v-model="message" :rows="4" required />
          </div>
          <button type="submit" class="orbit-submit" :disabled="isSending">Send message</button>
        </form>
      </section>
    </article>

    <!-- Bento Dark (OVERRRIDES-style) -->
    <article
      v-else-if="isBento"
      class="site-root site-layout-bento min-h-screen"
      :style="designStyle"
    >
      <aside class="bento-sidebar">
        <div>
          <p class="bento-brand">{{ pin.title }}</p>
          <p class="bento-tagline">{{ roleLabel || 'Studio' }}</p>
        </div>
        <nav class="bento-side-nav">
          <button type="button" @click="scrollToSection('about')">About</button>
          <button type="button" @click="scrollToSection('services')">Offerings</button>
          <button type="button" @click="scrollToSection('gallery')">Gallery</button>
          <button type="button" @click="scrollToSection('contact')">Contact</button>
        </nav>
        <p class="bento-other">OTHER</p>
      </aside>

      <div class="bento-main">
        <div class="bento-status">
          <span><i class="bento-dot bento-dot-green" />Published</span>
          <span><i class="bento-dot bento-dot-neon" />Gallery</span>
          <span><i class="bento-dot bento-dot-gray" />Contact</span>
        </div>

        <div class="bento-grid">
          <section class="bento-card bento-card-hero">
            <p class="bento-label">Hero</p>
            <h1 class="bento-hero-title">
              {{ sectionByKey('hero')?.title || pin.title }}
            </h1>
            <p class="bento-hero-body">
              {{ sectionByKey('hero')?.body || pin.description }}
            </p>
          </section>

          <section class="bento-card bento-card-media">
            <img
              v-if="featuredImage?.url"
              :src="featuredImage.url"
              :alt="featuredImage.alt || pin.title"
            />
            <div v-else class="bento-media-empty">Media</div>
            <span class="bento-play" aria-hidden="true" />
          </section>

          <section v-if="sectionByKey('about')" id="about" class="bento-card">
            <p class="bento-label">About</p>
            <h2 class="bento-card-title">{{ sectionByKey('about')?.title }}</h2>
            <p class="bento-card-body">{{ sectionByKey('about')?.body }}</p>
          </section>

          <section v-if="sectionByKey('services')" id="services" class="bento-card">
            <p class="bento-label">Offerings</p>
            <h2 class="bento-card-title">{{ sectionByKey('services')?.title }}</h2>
            <p class="bento-card-body">{{ sectionByKey('services')?.body }}</p>
          </section>

          <section id="gallery" class="bento-card bento-card-gallery">
            <p class="bento-label">Gallery</p>
            <div class="bento-thumbs">
              <img
                v-for="(image, index) in galleryImages.slice(0, 4)"
                :key="`bento-g-${index}`"
                :src="image.url"
                :alt="image.alt || `Gallery ${index + 1}`"
              />
              <p v-if="galleryImages.length === 0" class="bento-card-body">No images yet.</p>
            </div>
          </section>

          <section id="contact" class="bento-card bento-card-contact">
            <p class="bento-label">Contact</p>
            <h2 class="bento-card-title">
              {{ sectionByKey('contact')?.title || 'Get in touch' }}
            </h2>
            <form class="bento-form" @submit.prevent="submitContact">
              <div class="space-y-1">
                <Label for="contact-name-bento">Name</Label>
                <Input id="contact-name-bento" v-model="senderName" required />
              </div>
              <div class="space-y-1">
                <Label for="contact-email-bento">Email</Label>
                <Input id="contact-email-bento" v-model="senderEmail" type="email" required />
              </div>
              <div class="space-y-1">
                <Label for="contact-message-bento">Message</Label>
                <Textarea id="contact-message-bento" v-model="message" :rows="3" required />
              </div>
              <button type="submit" class="bento-submit" :disabled="isSending">Send</button>
            </form>
          </section>
        </div>
      </div>
    </article>

    <!-- Signal Bold (Mode-style) -->
    <article
      v-else-if="isSignal"
      class="site-root site-layout-signal min-h-screen"
      :style="designStyle"
    >
      <header class="signal-topbar">
        <p class="signal-brand">{{ pin.title }}</p>
        <nav class="signal-nav">
          <button type="button" @click="scrollToSection('about')">About</button>
          <button type="button" @click="scrollToSection('services')">Offerings</button>
          <button type="button" @click="scrollToSection('gallery')">Gallery</button>
        </nav>
        <div class="signal-top-actions">
          <button type="button" class="signal-btn-outline" @click="scrollToSection('services')">
            Explore
          </button>
          <button type="button" class="signal-btn-solid" @click="scrollToSection('contact')">
            Contact
          </button>
        </div>
      </header>

      <section class="signal-hero">
        <div class="signal-pills">
          <span
            v-for="(line, index) in signalHeadlinePills"
            :key="`signal-pill-${index}`"
            class="signal-pill"
            :style="{ marginLeft: `${index * 1.75}rem` }"
          >
            {{ line }}
          </span>
        </div>

        <div class="signal-widget" aria-hidden="true">
          <p class="signal-widget-label">
            {{ sectionByKey('services')?.title || 'Insights' }}
          </p>
          <div class="signal-bars">
            <span style="--h: 42%" /><span style="--h: 68%" /><span style="--h: 55%" />
            <span style="--h: 88%" /><span style="--h: 60%" /><span style="--h: 75%" />
          </div>
        </div>

        <div class="signal-photo">
          <img
            v-if="featuredImage?.url"
            :src="featuredImage.url"
            :alt="featuredImage.alt || pin.title"
          />
          <div v-else class="signal-photo-empty">Photo</div>
        </div>
      </section>

      <section v-if="sectionByKey('about')" id="about" class="signal-section">
        <p class="signal-kicker">About</p>
        <h2 class="signal-heading">{{ sectionByKey('about')?.title }}</h2>
        <p class="signal-body">{{ sectionByKey('about')?.body }}</p>
      </section>

      <section v-if="sectionByKey('services')" id="services" class="signal-section">
        <p class="signal-kicker">Offerings</p>
        <h2 class="signal-heading">{{ sectionByKey('services')?.title }}</h2>
        <p class="signal-body">{{ sectionByKey('services')?.body }}</p>
      </section>

      <section id="gallery" class="signal-section">
        <p class="signal-kicker">Gallery</p>
        <h2 class="signal-heading">{{ sectionByKey('gallery')?.title || 'Gallery' }}</h2>
        <div class="signal-gallery">
          <img
            v-for="(image, index) in galleryImages"
            :key="`signal-g-${index}`"
            :src="image.url"
            :alt="image.alt || `Gallery ${index + 1}`"
          />
          <p v-if="galleryImages.length === 0" class="signal-body">
            Upload gallery images in the site designer.
          </p>
        </div>
      </section>

      <section id="contact" class="signal-section signal-contact">
        <p class="signal-kicker">Contact</p>
        <h2 class="signal-heading">{{ sectionByKey('contact')?.title || 'Get in touch' }}</h2>
        <p class="signal-body">
          {{ sectionByKey('contact')?.body || 'Send a message and we will get back to you.' }}
        </p>
        <form class="signal-form" @submit.prevent="submitContact">
          <div class="space-y-1">
            <Label for="contact-name-signal">Name</Label>
            <Input id="contact-name-signal" v-model="senderName" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-email-signal">Email</Label>
            <Input id="contact-email-signal" v-model="senderEmail" type="email" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-message-signal">Message</Label>
            <Textarea id="contact-message-signal" v-model="message" :rows="4" required />
          </div>
          <button type="submit" class="signal-btn-solid" :disabled="isSending">Send message</button>
        </form>
      </section>
    </article>

    <!-- Vine Studio -->
    <article
      v-else-if="isVine"
      class="site-root site-layout-vine min-h-screen"
      :class="layoutClass"
      :style="designStyle"
    >
      <nav class="modern-nav">
        <p class="modern-logo">{{ pin.title }}</p>
        <div class="modern-nav-links">
          <button type="button" @click="scrollToSection('about')">About</button>
          <button type="button" @click="scrollToSection('services')">Offerings</button>
          <button type="button" @click="scrollToSection('gallery')">Gallery</button>
          <button type="button" class="modern-nav-cta" @click="scrollToSection('contact')">
            Contact
          </button>
        </div>
      </nav>

      <header class="modern-hero">
        <div class="modern-hero-copy">
          <p class="site-kicker">{{ roleLabel }}</p>
          <h1 class="modern-hero-title">
            {{ sectionByKey('hero')?.title || pin.title }}
          </h1>
          <p class="modern-hero-body">
            {{ sectionByKey('hero')?.body || pin.description }}
          </p>
          <button type="button" class="modern-primary-btn" @click="scrollToSection('contact')">
            Get in touch
          </button>
        </div>
        <div class="modern-hero-visual">
          <div class="modern-hero-glow" />
          <img
            v-if="featuredImage?.url"
            :src="featuredImage.url"
            :alt="featuredImage.alt || pin.title"
            class="modern-hero-image"
          />
          <div v-else class="modern-hero-placeholder">Add a featured photo</div>
        </div>
      </header>

      <section
        v-if="sectionByKey('about')"
        id="about"
        class="modern-band modern-about"
      >
        <p class="site-kicker">About</p>
        <h2 class="modern-section-title">{{ sectionByKey('about')?.title }}</h2>
        <p class="modern-section-body">{{ sectionByKey('about')?.body }}</p>
      </section>

      <section
        v-if="sectionByKey('services')"
        id="services"
        class="modern-band"
      >
        <div class="modern-band-head">
          <p class="site-kicker">Offerings</p>
          <h2 class="modern-section-title">{{ sectionByKey('services')?.title }}</h2>
        </div>
        <p class="modern-section-body modern-band-intro">
          {{ sectionByKey('services')?.body }}
        </p>
        <div class="modern-card-rail">
          <article
            v-for="(image, index) in (sectionByKey('services')?.images?.length
              ? sectionByKey('services')!.images
              : galleryImages.slice(0, 3))"
            :key="`service-${index}`"
            class="modern-offer-card"
          >
            <img :src="image.url" :alt="image.alt || `Offering ${index + 1}`" />
            <p>{{ image.alt || `Selection ${index + 1}` }}</p>
          </article>
          <article
            v-if="!(sectionByKey('services')?.images?.length || galleryImages.length)"
            class="modern-offer-card modern-offer-empty"
          >
            <p>Add offering photos in the site designer</p>
          </article>
        </div>
      </section>

      <section id="gallery" class="modern-band">
        <div class="modern-band-head">
          <p class="site-kicker">Gallery</p>
          <h2 class="modern-section-title">
            {{ sectionByKey('gallery')?.title || 'Moments' }}
          </h2>
        </div>
        <div class="modern-gallery-rail">
          <img
            v-for="(image, index) in galleryImages"
            :key="`gallery-${index}`"
            :src="image.url"
            :alt="image.alt || `Gallery ${index + 1}`"
          />
          <div v-if="galleryImages.length === 0" class="modern-gallery-empty">
            Upload gallery images to fill this showcase strip.
          </div>
        </div>
      </section>

      <section id="contact" class="modern-band modern-contact">
        <div>
          <p class="site-kicker">Contact</p>
          <h2 class="modern-section-title">
            {{ sectionByKey('contact')?.title || 'Let’s talk' }}
          </h2>
          <p class="modern-section-body">
            {{ sectionByKey('contact')?.body || 'Send a message and we will get back to you.' }}
          </p>
        </div>
        <form class="modern-contact-form" @submit.prevent="submitContact">
          <div class="space-y-1">
            <Label for="contact-name-vine">Name</Label>
            <Input id="contact-name-vine" v-model="senderName" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-email-vine">Email</Label>
            <Input id="contact-email-vine" v-model="senderEmail" type="email" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-message-vine">Message</Label>
            <Textarea id="contact-message-vine" v-model="message" :rows="4" required />
          </div>
          <button type="submit" class="modern-primary-btn" :disabled="isSending">
            Send message
          </button>
        </form>
      </section>
    </article>

    <!-- Nomad Immersive (NÓMADE-inspired) -->
    <article
      v-else-if="isNomade"
      class="site-root site-layout-nomade min-h-screen"
      :style="designStyle"
    >
      <header class="nomade-topbar">
        <button type="button" class="nomade-menu" aria-label="Menu" @click="scrollToSection('about')">
          <span /><span /><span />
        </button>
        <p class="nomade-brand">{{ pin.title }}</p>
        <div class="nomade-topbar-right">
          <span class="nomade-role">{{ roleLabel }}</span>
        </div>
      </header>

      <section class="nomade-hero">
        <img
          v-if="featuredImage?.url"
          :src="featuredImage.url"
          :alt="featuredImage.alt || pin.title"
          class="nomade-hero-image"
        />
        <div v-else class="nomade-hero-fallback" aria-hidden="true" />
        <div class="nomade-hero-shade" aria-hidden="true" />

        <div class="nomade-hero-copy">
          <h1 class="nomade-hero-title">
            <span v-for="(line, index) in heroHeadlineLines" :key="`line-${index}`">{{ line }}</span>
          </h1>
          <p class="nomade-hero-sub">
            {{ sectionByKey('hero')?.body || pin.description }}
          </p>
        </div>

        <div class="nomade-monogram" aria-hidden="true">
          <span v-for="(letter, index) in brandMonogram" :key="`mono-${index}`">{{ letter }}</span>
        </div>

        <div class="nomade-ghost-row">
          <button
            v-for="btn in nomadeGhostButtons"
            :key="btn.id"
            type="button"
            class="nomade-ghost-btn"
            @click="scrollToSection(btn.id)"
          >
            {{ btn.label }}
          </button>
        </div>
      </section>

      <section
        v-if="sectionByKey('about')"
        id="about"
        class="nomade-band"
      >
        <p class="nomade-kicker">About</p>
        <h2 class="nomade-heading">{{ sectionByKey('about')?.title }}</h2>
        <p class="nomade-body">{{ sectionByKey('about')?.body }}</p>
      </section>

      <section
        v-if="sectionByKey('services')"
        id="services"
        class="nomade-band"
      >
        <p class="nomade-kicker">Offerings</p>
        <h2 class="nomade-heading">{{ sectionByKey('services')?.title }}</h2>
        <p class="nomade-body">{{ sectionByKey('services')?.body }}</p>
      </section>

      <section id="gallery" class="nomade-band">
        <p class="nomade-kicker">Gallery</p>
        <h2 class="nomade-heading">{{ sectionByKey('gallery')?.title || 'Moments' }}</h2>
        <div class="nomade-gallery">
          <img
            v-for="(image, index) in galleryImages"
            :key="`nomade-g-${index}`"
            :src="image.url"
            :alt="image.alt || `Gallery ${index + 1}`"
          />
          <p v-if="galleryImages.length === 0" class="nomade-body">
            Upload gallery images in the site designer.
          </p>
        </div>
      </section>

      <section id="contact" class="nomade-band nomade-contact">
        <p class="nomade-kicker">Contact</p>
        <h2 class="nomade-heading">
          {{ sectionByKey('contact')?.title || 'Get in touch' }}
        </h2>
        <p class="nomade-body">
          {{ sectionByKey('contact')?.body || 'Send a message and we will get back to you.' }}
        </p>
        <form class="nomade-form" @submit.prevent="submitContact">
          <div class="space-y-1">
            <Label for="contact-name-nomade">Name</Label>
            <Input id="contact-name-nomade" v-model="senderName" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-email-nomade">Email</Label>
            <Input id="contact-email-nomade" v-model="senderEmail" type="email" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-message-nomade">Message</Label>
            <Textarea id="contact-message-nomade" v-model="message" :rows="4" required />
          </div>
          <button type="submit" class="nomade-submit" :disabled="isSending">Send message</button>
        </form>
      </section>
    </article>

    <!-- Fallback → corporate -->
    <article
      v-else
      class="site-root site-layout-corporate min-h-screen"
      :style="designStyle"
    >
      <nav class="corp-nav">
        <p class="corp-brand">{{ pin.title }}</p>
        <button type="button" class="corp-nav-cta" @click="scrollToSection('contact')">
          Get in touch
        </button>
      </nav>
      <header class="corp-hero">
        <div class="corp-hero-copy">
          <h1 class="corp-hero-title">{{ pin.title }}</h1>
          <p class="corp-hero-sub">{{ pin.description }}</p>
        </div>
      </header>
      <section id="contact" class="corp-section">
        <form class="corp-form" @submit.prevent="submitContact">
          <div class="space-y-1">
            <Label for="contact-name-corporate-fb">Name</Label>
            <Input id="contact-name-corporate-fb" v-model="senderName" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-email-corporate-fb">Email</Label>
            <Input id="contact-email-corporate-fb" v-model="senderEmail" type="email" required />
          </div>
          <div class="space-y-1">
            <Label for="contact-message-corporate-fb">Message</Label>
            <Textarea id="contact-message-corporate-fb" v-model="message" :rows="4" required />
          </div>
          <button type="submit" class="corp-nav-cta corp-submit" :disabled="isSending">
            Send message
          </button>
        </form>
      </section>
    </article>
  </div>
</template>

<style scoped>
.site-root {
  font-family: var(--site-font-secondary);
  color: var(--site-ink);
}

.site-kicker {
  font-family: var(--site-font-tertiary);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.7rem;
  color: var(--site-accent);
}

/* ── Corporate (Nourish Shop) ───────────────────────────────────────────── */
.site-layout-corporate {
  background: var(--site-bg, #f4f7f2);
  color: var(--corp-ink, #1c2b24);
}

.corp-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 0.95rem clamp(1.25rem, 4vw, 3rem);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(28, 43, 36, 0.06);
}

.corp-brand {
  margin: 0;
  justify-self: start;
  font-family: var(--site-font-primary);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  color: var(--corp-ink, #1c2b24);
}

.corp-nav-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.corp-nav-links button {
  background: none;
  border: 0;
  font-size: 0.92rem;
  font-weight: 500;
  color: rgba(28, 43, 36, 0.62);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.corp-nav-links button:hover {
  color: var(--corp-sage, #5f8f6b);
}

.corp-nav-cta,
.corp-submit {
  appearance: none;
  justify-self: end;
  background: var(--corp-sage, #5f8f6b);
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 0.7rem 1.35rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(95, 143, 107, 0.22);
  transition: background 0.2s ease, transform 0.2s ease;
}

.corp-nav-cta:hover,
.corp-submit:hover {
  background: var(--corp-sage-soft, #6fa37c);
}

.corp-nav-cta:disabled,
.corp-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.corp-hero {
  padding: clamp(1.25rem, 3vw, 2rem) clamp(1rem, 3vw, 1.75rem) 0.5rem;
}

.corp-hero-panel {
  display: grid;
  gap: clamp(1.75rem, 4vw, 3rem);
  align-items: center;
  min-height: 62vh;
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem);
  border-radius: 2rem;
  background:
    radial-gradient(circle at 88% 18%, rgba(240, 201, 168, 0.45) 0%, transparent 32%),
    linear-gradient(145deg, #eef5ec 0%, #f4f7f2 48%, #e8f0e4 100%);
  overflow: hidden;
}

.corp-hero-copy {
  position: relative;
  z-index: 1;
  animation: site-rise 0.85s ease-out both;
}

.corp-hero-title {
  margin: 0.55rem 0 0;
  font-family: var(--site-font-primary);
  font-size: clamp(2.35rem, 5.5vw, 3.85rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.03em;
  max-width: 12ch;
  color: var(--corp-ink, #1c2b24);
}

.corp-hero-sub {
  margin: 1.15rem 0 0;
  max-width: 30rem;
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(28, 43, 36, 0.72);
}

.corp-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.corp-btn-primary,
.corp-btn-ghost {
  appearance: none;
  border-radius: 999px;
  padding: 0.8rem 1.45rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.corp-btn-primary {
  background: var(--corp-sage, #5f8f6b);
  color: #fff;
  border: 0;
  box-shadow: 0 10px 22px rgba(95, 143, 107, 0.2);
}

.corp-btn-primary:hover {
  background: var(--corp-sage-soft, #6fa37c);
}

.corp-btn-ghost {
  background: transparent;
  color: var(--corp-ink, #1c2b24);
  border: 1.5px solid rgba(28, 43, 36, 0.18);
}

.corp-btn-ghost:hover {
  border-color: var(--corp-sage, #5f8f6b);
  color: var(--corp-sage, #5f8f6b);
}

.corp-hero-media {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  animation: site-rise 1s ease-out 0.12s both;
}

.corp-hero-blob {
  position: absolute;
  width: min(88%, 22rem);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(240, 201, 168, 0.75), transparent 55%),
    radial-gradient(circle at 70% 65%, rgba(111, 163, 124, 0.35), transparent 60%);
  filter: blur(2px);
  animation: corp-blob-float 7s ease-in-out infinite;
}

.corp-hero-card {
  position: relative;
  z-index: 1;
  width: min(100%, 26rem);
  padding: 0.65rem;
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 24px 50px rgba(28, 43, 36, 0.1);
}

.corp-hero-image,
.corp-hero-placeholder {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 1.35rem;
}

.corp-hero-placeholder {
  display: grid;
  place-items: center;
  background: rgba(95, 143, 107, 0.1);
  border: 1px dashed rgba(95, 143, 107, 0.35);
  color: rgba(28, 43, 36, 0.45);
}

.corp-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.65rem;
  overflow-x: auto;
  padding: 1.35rem clamp(1.25rem, 4vw, 3rem) 0.35rem;
  scrollbar-width: none;
  animation: site-fade 0.9s ease-out 0.15s both;
}

.corp-chips::-webkit-scrollbar {
  display: none;
}

.corp-chip {
  appearance: none;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  padding: 0.65rem 1.15rem;
  background: #fff;
  color: var(--corp-ink, #1c2b24);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(28, 43, 36, 0.05);
  transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.corp-chip:hover {
  color: #fff;
  background: var(--corp-sage, #5f8f6b);
  transform: translateY(-1px);
}

.corp-section {
  max-width: 68rem;
  margin: 0 auto;
  padding: clamp(2.75rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 2rem);
}

.corp-soft {
  margin: 0 clamp(1rem, 3vw, 1.75rem);
  max-width: none;
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.55);
  padding: clamp(2.25rem, 5vw, 3.5rem) clamp(1.35rem, 4vw, 2.5rem);
}

.corp-featured {
  animation: site-rise 0.9s ease-out 0.1s both;
}

.corp-kicker {
  margin: 0 0 0.55rem;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--corp-sage, #5f8f6b);
  font-weight: 700;
}

.corp-heading {
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: clamp(1.7rem, 3.2vw, 2.35rem);
  font-weight: 700;
  color: var(--corp-ink, #1c2b24);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.corp-body {
  margin: 1rem 0 0;
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(28, 43, 36, 0.72);
  white-space: pre-wrap;
  max-width: 42rem;
}

.corp-products {
  margin-top: 1.75rem;
  display: grid;
  gap: 1.15rem;
  grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
}

.corp-product {
  background: #fff;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 14px 32px rgba(28, 43, 36, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.corp-product:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 36px rgba(28, 43, 36, 0.1);
}

.corp-product-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: var(--corp-mint, #eef5ec);
}

.corp-product-copy {
  padding: 1rem 1.05rem 1.2rem;
}

.corp-product-title {
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--corp-ink, #1c2b24);
}

.corp-product-body {
  margin: 0.4rem 0 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: rgba(28, 43, 36, 0.62);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.corp-gallery {
  margin-top: 1.75rem;
  display: grid;
  gap: 0.95rem;
  grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
}

.corp-gallery img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 1.35rem;
  box-shadow: 0 12px 28px rgba(28, 43, 36, 0.06);
}

.corp-contact {
  padding-bottom: clamp(3.5rem, 8vw, 5.5rem);
}

.corp-contact-card {
  max-width: 36rem;
  margin: 0 auto;
  padding: clamp(1.75rem, 4vw, 2.5rem);
  border-radius: 1.75rem;
  background: #fff;
  box-shadow: 0 18px 42px rgba(28, 43, 36, 0.07);
  animation: site-fade 1s ease-out 0.12s both;
}

.corp-form {
  margin-top: 1.5rem;
  display: grid;
  gap: 0.85rem;
}

@media (min-width: 900px) {
  .corp-hero-panel {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

@media (max-width: 720px) {
  .corp-nav {
    grid-template-columns: 1fr auto;
  }

  .corp-nav-links {
    display: none;
  }

  .corp-hero-panel {
    border-radius: 1.5rem;
    min-height: auto;
  }
}

@keyframes corp-blob-float {
  0%,
  100% {
    transform: translate(8%, 6%);
  }
  50% {
    transform: translate(8%, calc(6% - 12px));
  }
}

/* ── Orbit (Apple Siri) ─────────────────────────────────────────────────── */
.site-layout-orbit {
  background: #fff;
  color: #1d1d1f;
}

.orbit-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem clamp(1.25rem, 4vw, 3rem);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}

.orbit-brand {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: #1d1d1f;
}

.orbit-nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.1rem;
}

.orbit-nav-links button {
  background: none;
  border: 0;
  font-size: 0.8rem;
  color: rgba(29, 29, 31, 0.65);
  cursor: pointer;
}

.orbit-nav-links button:hover {
  color: #1d1d1f;
}

.orbit-hero {
  position: relative;
  min-height: min(78vh, 720px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 1.25rem 5rem;
  overflow: hidden;
}

.orbit-float-stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orbit-float {
  position: absolute;
  object-fit: cover;
  border-radius: 1.25rem;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.12);
  animation: site-float 7s ease-in-out infinite;
}

.orbit-float-ph {
  background: #e8e8ed;
  box-shadow: none;
}

.orbit-float-1 {
  --rot: -12deg;
  width: 7.5rem;
  height: 9.5rem;
  top: 12%;
  left: 8%;
  animation-delay: 0s;
}

.orbit-float-2 {
  --rot: 8deg;
  width: 6rem;
  height: 7.5rem;
  top: 18%;
  right: 10%;
  animation-delay: 0.4s;
}

.orbit-float-3 {
  --rot: 6deg;
  width: 8.5rem;
  height: 6.5rem;
  bottom: 16%;
  left: 14%;
  animation-delay: 0.8s;
}

.orbit-float-4 {
  --rot: -7deg;
  width: 5.5rem;
  height: 7rem;
  bottom: 20%;
  right: 16%;
  animation-delay: 1.1s;
}

.orbit-float-5 {
  --rot: 0deg;
  width: 4.5rem;
  height: 4.5rem;
  top: 42%;
  right: 28%;
  border-radius: 50%;
  animation-delay: 0.6s;
}

.orbit-title {
  position: relative;
  z-index: 2;
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: clamp(3.2rem, 10vw, 6.5rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  background: linear-gradient(100deg, var(--orbit-magenta, #ff2d95), var(--orbit-cyan, #5ac8fa));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: site-rise 0.9s ease-out both;
}

.orbit-sub {
  position: relative;
  z-index: 2;
  margin: 1.5rem 0 0;
  max-width: 28rem;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(29, 29, 31, 0.65);
  animation: site-rise 1s ease-out 0.1s both;
}

.orbit-section {
  max-width: 40rem;
  margin: 0 auto;
  padding: clamp(3.5rem, 8vw, 6rem) 1.25rem;
  text-align: center;
}

.orbit-kicker {
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(29, 29, 31, 0.4);
}

.orbit-heading {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.orbit-body {
  margin: 1rem 0 0;
  line-height: 1.7;
  color: rgba(29, 29, 31, 0.68);
  white-space: pre-wrap;
}

.orbit-gallery-strip {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  justify-content: center;
}

.orbit-gallery-strip img {
  width: 11rem;
  height: 14rem;
  object-fit: cover;
  border-radius: 1.5rem;
  flex-shrink: 0;
}

.orbit-form {
  margin: 1.75rem auto 0;
  display: grid;
  gap: 0.85rem;
  max-width: 24rem;
  text-align: left;
}

.orbit-submit {
  appearance: none;
  background: #1d1d1f;
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 0.85rem 1.4rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.orbit-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .orbit-float-3,
  .orbit-float-4,
  .orbit-float-5 {
    display: none;
  }

  .orbit-float-1,
  .orbit-float-2 {
    opacity: 0.55;
    width: 4.5rem;
    height: 5.5rem;
  }
}

/* ── Bento Dark (OVERRRIDES) ────────────────────────────────────────────── */
.site-layout-bento {
  display: grid;
  grid-template-columns: 13rem 1fr;
  min-height: 100vh;
  background: var(--bento-charcoal, #0d0d0d);
  color: #fff;
}

.bento-sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem 1rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: #0a0a0a;
}

.bento-brand {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 600;
}

.bento-tagline {
  margin: 0.5rem 0 0;
  font-family: var(--site-font-tertiary);
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.45);
}

.bento-side-nav {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.bento-side-nav button {
  appearance: none;
  text-align: left;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.65rem;
  color: rgba(255, 255, 255, 0.72);
  padding: 0.55rem 0.7rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.bento-side-nav button:hover {
  border-color: var(--bento-neon, #ccff00);
  color: var(--bento-neon, #ccff00);
}

.bento-other {
  margin: 0;
  font-family: var(--site-font-tertiary);
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.35);
}

.bento-main {
  padding: 1.25rem;
  overflow: auto;
}

.bento-status {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-bottom: 1rem;
  font-family: var(--site-font-tertiary);
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.55);
}

.bento-status span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.bento-dot {
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
}

.bento-dot-green { background: #4ade80; }
.bento-dot-neon { background: var(--bento-neon, #ccff00); }
.bento-dot-gray { background: #6b7280; }

.bento-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(8rem, auto);
}

.bento-card {
  background: var(--bento-panel, #1a1a1a);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 1.1rem;
  animation: site-rise 0.7s ease-out both;
}

.bento-card:nth-child(2) { animation-delay: 0.06s; }
.bento-card:nth-child(3) { animation-delay: 0.1s; }
.bento-card:nth-child(4) { animation-delay: 0.14s; }
.bento-card:nth-child(5) { animation-delay: 0.18s; }
.bento-card:nth-child(6) { animation-delay: 0.22s; }

.bento-card-hero {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-card-media {
  grid-column: span 2;
  grid-row: span 2;
  position: relative;
  padding: 0;
  overflow: hidden;
}

.bento-card-media img,
.bento-media-empty {
  width: 100%;
  height: 100%;
  min-height: 16rem;
  object-fit: cover;
}

.bento-media-empty {
  display: grid;
  place-items: center;
  background: #222;
  color: rgba(255, 255, 255, 0.4);
}

.bento-play {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 3rem;
  height: 3rem;
  margin: -1.5rem 0 0 -1.5rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.35);
}

.bento-play::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 54%;
  transform: translate(-50%, -50%);
  border-style: solid;
  border-width: 0.45rem 0 0.45rem 0.75rem;
  border-color: transparent transparent transparent #fff;
}

.bento-label {
  margin: 0 0 0.65rem;
  font-family: var(--site-font-tertiary);
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--bento-neon, #ccff00);
}

.bento-hero-title {
  margin: 0;
  font-family: var(--site-font-tertiary);
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--bento-neon, #ccff00);
}

.bento-hero-body,
.bento-card-body {
  margin: 0.85rem 0 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.65);
  white-space: pre-wrap;
}

.bento-card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.bento-thumbs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.bento-thumbs img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem;
}

.bento-form {
  margin-top: 0.85rem;
  display: grid;
  gap: 0.65rem;
}

.bento-form :deep(label),
.bento-form :deep(input),
.bento-form :deep(textarea) {
  color: #fff;
}

.bento-form :deep(input),
.bento-form :deep(textarea) {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.15);
}

.bento-submit {
  appearance: none;
  background: var(--bento-neon, #ccff00);
  color: #0d0d0d;
  border: 0;
  border-radius: 0.65rem;
  padding: 0.7rem 1rem;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.bento-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 960px) {
  .site-layout-bento {
    grid-template-columns: 1fr;
  }

  .bento-sidebar {
    flex-direction: row;
    align-items: center;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .bento-side-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .bento-other {
    display: none;
  }

  .bento-grid {
    grid-template-columns: 1fr 1fr;
  }

  .bento-card-hero,
  .bento-card-media {
    grid-column: span 2;
  }
}

@media (max-width: 600px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }

  .bento-card-hero,
  .bento-card-media {
    grid-column: span 1;
  }
}

/* ── Signal Bold (Mode) ─────────────────────────────────────────────────── */
.site-layout-signal {
  background: var(--signal-cream, #f4f1ea);
  color: var(--signal-forest, #1a3c34);
}

.signal-topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1rem clamp(1.25rem, 4vw, 2.5rem);
  background: var(--signal-cream, #f4f1ea);
  border-bottom: 1px solid rgba(26, 60, 52, 0.08);
}

.signal-brand {
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--signal-forest, #1a3c34);
}

.signal-nav {
  display: flex;
  gap: 1.25rem;
}

.signal-nav button {
  background: none;
  border: 0;
  font-size: 0.88rem;
  color: rgba(26, 60, 52, 0.75);
  cursor: pointer;
}

.signal-top-actions {
  justify-self: end;
  display: flex;
  gap: 0.55rem;
}

.signal-btn-outline,
.signal-btn-solid {
  appearance: none;
  border-radius: 999px;
  padding: 0.6rem 1.1rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.signal-btn-outline {
  background: transparent;
  border: 1.5px solid var(--signal-forest, #1a3c34);
  color: var(--signal-forest, #1a3c34);
}

.signal-btn-solid {
  background: var(--signal-forest, #1a3c34);
  border: 0;
  color: #fff;
}

.signal-btn-solid:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.signal-hero {
  position: relative;
  min-height: min(72vh, 680px);
  margin: 0 0.75rem;
  padding: clamp(2.5rem, 6vw, 4rem) clamp(1.25rem, 4vw, 3rem) 8rem;
  background: var(--signal-forest, #1a3c34);
  border-radius: 0 0 2.5rem 2.5rem;
  overflow: hidden;
  color: #fff;
}

.signal-pills {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-width: 36rem;
  animation: site-rise 0.85s ease-out both;
}

.signal-pill {
  display: inline-flex;
  align-self: flex-start;
  background: var(--signal-lime, #c8f135);
  color: var(--signal-forest, #1a3c34);
  font-family: var(--site-font-primary);
  font-size: clamp(1.6rem, 4.5vw, 3rem);
  font-weight: 700;
  line-height: 1.15;
  padding: 0.45rem 1.15rem;
  border-radius: 999px;
  letter-spacing: -0.02em;
}

.signal-widget {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: min(11rem, 42vw);
  padding: 0.85rem;
  background: rgba(10, 28, 24, 0.85);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  animation: site-fade 1s ease-out 0.15s both;
}

.signal-widget-label {
  margin: 0 0 0.65rem;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.signal-bars {
  display: flex;
  align-items: flex-end;
  gap: 0.35rem;
  height: 4.5rem;
}

.signal-bars span {
  flex: 1;
  height: var(--h, 50%);
  border-radius: 0.25rem 0.25rem 0 0;
  background: linear-gradient(180deg, var(--signal-lime, #c8f135), rgba(200, 241, 53, 0.35));
  animation: site-bar 0.9s ease-out both;
}

.signal-bars span:nth-child(2) { animation-delay: 0.05s; }
.signal-bars span:nth-child(3) { animation-delay: 0.1s; }
.signal-bars span:nth-child(4) { animation-delay: 0.15s; }
.signal-bars span:nth-child(5) { animation-delay: 0.2s; }
.signal-bars span:nth-child(6) { animation-delay: 0.25s; }

.signal-photo {
  position: absolute;
  left: 1.25rem;
  bottom: -2.5rem;
  width: min(16rem, 55vw);
  aspect-ratio: 4 / 5;
  border-radius: 0 2.5rem 0 0;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
  animation: site-rise 1s ease-out 0.12s both;
}

.signal-photo img,
.signal-photo-empty {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.signal-photo-empty {
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.5);
}

.signal-section {
  max-width: 48rem;
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 5rem) clamp(1.25rem, 4vw, 2rem);
}

.signal-section:first-of-type {
  padding-top: 5rem;
}

.signal-kicker {
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(26, 60, 52, 0.5);
}

.signal-heading {
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  color: var(--signal-forest, #1a3c34);
  line-height: 1.15;
}

.signal-body {
  margin: 1rem 0 0;
  line-height: 1.7;
  color: rgba(26, 60, 52, 0.78);
  white-space: pre-wrap;
}

.signal-gallery {
  margin-top: 1.75rem;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
}

.signal-gallery img {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 1.25rem;
}

.signal-form {
  margin-top: 1.75rem;
  display: grid;
  gap: 0.85rem;
  max-width: 28rem;
}

@media (max-width: 720px) {
  .signal-topbar {
    grid-template-columns: 1fr auto;
  }

  .signal-nav {
    display: none;
  }

  .signal-widget {
    display: none;
  }

  .signal-hero {
    padding-bottom: 6rem;
  }

  .signal-pill {
    margin-left: 0 !important;
  }
}

/* ── Vine Studio (kept modern-* class names for vine only) ──────────────── */
.site-layout-vine {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 50% at 70% 35%, rgba(196, 165, 116, 0.22), transparent 60%),
    radial-gradient(ellipse 40% 35% at 20% 80%, rgba(90, 40, 30, 0.35), transparent 70%),
    var(--site-bg);
  color: var(--site-ink);
}

.modern-nav,
.modern-hero,
.modern-band {
  position: relative;
  z-index: 1;
}

.modern-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  max-width: 78rem;
  margin: 0 auto;
  border-bottom: 1px solid rgba(244, 235, 224, 0.08);
}

.modern-logo {
  font-family: var(--site-font-primary);
  font-size: 1.05rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  font-weight: 500;
}

.modern-nav-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
}

.modern-nav-links button {
  background: transparent;
  border: 0;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.72rem;
  color: rgba(244, 235, 224, 0.72);
  cursor: pointer;
}

.modern-nav-links button:hover {
  color: #f4ebe0;
}

.modern-nav-cta {
  border: 1px solid rgba(196, 165, 116, 0.55) !important;
  border-radius: 999px !important;
  padding: 0.45rem 1rem !important;
  color: #c4a574 !important;
}

.site-layout-vine .site-kicker {
  color: #c4a574;
  letter-spacing: 0.28em;
}

.modern-hero {
  display: grid;
  gap: 2.5rem;
  align-items: center;
  max-width: 78rem;
  margin: 0 auto;
  min-height: min(88vh, 820px);
  padding: 3rem 1.5rem 4rem;
}

.modern-hero-title {
  font-family: var(--site-font-primary);
  font-size: clamp(3.2rem, 8vw, 6.4rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  margin-top: 1rem;
  max-width: 9ch;
  color: #f7f0e6;
}

.modern-hero-body {
  margin-top: 1.25rem;
  max-width: 28rem;
  font-size: 1.08rem;
  line-height: 1.65;
  color: rgba(244, 235, 224, 0.78);
}

.modern-primary-btn {
  margin-top: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.95rem 1.8rem;
  background: transparent;
  border: 1px solid #c4a574;
  color: #c4a574;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.78rem;
  cursor: pointer;
}

.modern-primary-btn:hover {
  background: rgba(196, 165, 116, 0.12);
}

.modern-primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modern-hero-visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 28rem;
}

.modern-hero-glow {
  position: absolute;
  width: 85%;
  height: 85%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(196, 165, 116, 0.35), transparent 68%);
  filter: blur(28px);
}

.modern-hero-image {
  position: relative;
  z-index: 1;
  width: min(100%, 20rem);
  height: min(78vw, 38rem);
  object-fit: cover;
  border-radius: 999px 999px 1.5rem 1.5rem;
  box-shadow:
    0 40px 100px rgba(0, 0, 0, 0.55),
    0 0 60px rgba(196, 165, 116, 0.18);
}

.modern-hero-placeholder {
  position: relative;
  z-index: 1;
  width: min(100%, 18rem);
  height: 34rem;
  display: grid;
  place-items: center;
  border-radius: 999px 999px 1.5rem 1.5rem;
  border: 1px dashed rgba(196, 165, 116, 0.35);
  color: rgba(244, 235, 224, 0.5);
  background: rgba(30, 22, 18, 0.7);
}

.modern-band {
  max-width: 78rem;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  border-top: 1px solid rgba(244, 235, 224, 0.06);
}

.modern-about {
  text-align: center;
  max-width: 48rem;
}

.modern-section-title {
  font-family: var(--site-font-primary);
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.05;
  margin-top: 0.75rem;
  color: #f7f0e6;
}

.modern-section-body {
  margin-top: 1rem;
  line-height: 1.7;
  color: rgba(244, 235, 224, 0.75);
  white-space: pre-wrap;
}

.modern-band-intro {
  max-width: 40rem;
  margin-bottom: 1.5rem;
}

.modern-card-rail,
.modern-gallery-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, 280px);
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x mandatory;
}

.modern-offer-card {
  scroll-snap-align: start;
  background: rgba(30, 22, 18, 0.9);
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1px solid rgba(196, 165, 116, 0.16);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.modern-offer-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.modern-offer-card p {
  padding: 0.9rem 1rem 1.1rem;
  font-size: 0.92rem;
  color: #f4ebe0;
}

.modern-offer-empty,
.modern-gallery-empty {
  display: grid;
  place-items: center;
  min-height: 180px;
  padding: 1rem;
  border-radius: 1.25rem;
  border: 1px dashed rgba(196, 165, 116, 0.35);
  opacity: 0.75;
  font-size: 0.9rem;
}

.modern-gallery-rail img {
  scroll-snap-align: start;
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: 1.25rem;
  border: 1px solid rgba(196, 165, 116, 0.12);
}

.modern-contact {
  display: grid;
  gap: 2rem;
  margin-bottom: 3rem;
  padding: 2rem 1.5rem;
  border-radius: 1.75rem;
  background: linear-gradient(160deg, rgba(30, 22, 18, 0.95), rgba(20, 14, 12, 0.98));
  border: 1px solid rgba(196, 165, 116, 0.2);
}

.modern-contact-form {
  display: grid;
  gap: 0.85rem;
}

.modern-contact :deep(label),
.modern-contact :deep(input),
.modern-contact :deep(textarea) {
  color: #f4ebe0;
}

.modern-contact :deep(input),
.modern-contact :deep(textarea) {
  background: rgba(244, 235, 224, 0.04);
  border-color: rgba(196, 165, 116, 0.25);
}

@media (min-width: 900px) {
  .modern-hero {
    grid-template-columns: 1.05fr 0.95fr;
    padding: 3rem 2rem 5rem;
    gap: 3rem;
  }

  .modern-nav {
    padding: 1.5rem 2rem;
  }

  .modern-band {
    padding: 4rem 2rem;
  }

  .modern-contact {
    grid-template-columns: 1fr 1fr;
    align-items: start;
    margin-left: 2rem;
    margin-right: 2rem;
    max-width: calc(78rem - 4rem);
  }
}

/* ── Nomad Immersive ────────────────────────────────────────────────────── */
.site-layout-nomade {
  background: #fff;
  color: #111;
}

.nomade-topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 20;
}

.nomade-menu {
  justify-self: start;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 1.5rem;
  padding: 0.25rem 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.nomade-menu span {
  display: block;
  height: 1.5px;
  width: 100%;
  background: #111;
}

.nomade-brand {
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: clamp(0.95rem, 2.2vw, 1.15rem);
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  text-align: center;
}

.nomade-topbar-right {
  justify-self: end;
}

.nomade-role {
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.55);
  border: 1px solid rgba(17, 17, 17, 0.18);
  padding: 0.4rem 0.7rem;
}

.nomade-hero {
  position: relative;
  min-height: calc(100vh - 3.75rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  color: #fff;
}

.nomade-hero-image,
.nomade-hero-fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nomade-hero-fallback {
  background: linear-gradient(145deg, #2a2a2a 0%, #111 45%, #3a322c 100%);
}

.nomade-hero-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.15) 55%, rgba(0, 0, 0, 0.35) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.55) 100%);
}

.nomade-hero-copy {
  position: relative;
  z-index: 2;
  padding: clamp(2rem, 6vw, 4.5rem) clamp(1.25rem, 5vw, 4rem);
  max-width: 40rem;
  animation: nomade-rise 0.9s ease-out both;
}

.nomade-hero-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.05em;
  font-family: var(--site-font-primary);
  font-size: clamp(2.6rem, 8vw, 5.6rem);
  font-weight: 600;
  line-height: 0.95;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.nomade-hero-sub {
  margin: 1.25rem 0 0;
  max-width: 28rem;
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.88);
  animation: nomade-rise 1s ease-out 0.12s both;
}

.nomade-monogram {
  position: absolute;
  top: 50%;
  right: clamp(1.25rem, 6vw, 4rem);
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.15rem 0.35rem;
  width: 3.4rem;
  padding: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.75);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-align: center;
  animation: nomade-fade 1.1s ease-out 0.2s both;
}

.nomade-ghost-row {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  padding: 0 clamp(1.25rem, 5vw, 4rem) clamp(1.5rem, 4vw, 2.5rem);
  animation: nomade-rise 1s ease-out 0.22s both;
}

.nomade-ghost-btn {
  appearance: none;
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.85);
  padding: 0.7rem 1.1rem;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.nomade-ghost-btn:hover {
  background: #fff;
  color: #111;
}

.nomade-band {
  max-width: 52rem;
  margin: 0 auto;
  padding: clamp(3rem, 8vw, 5.5rem) clamp(1.25rem, 5vw, 2rem);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.nomade-kicker {
  margin: 0 0 0.75rem;
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(17, 17, 17, 0.45);
}

.nomade-heading {
  margin: 0;
  font-family: var(--site-font-primary);
  font-size: clamp(1.75rem, 4vw, 2.6rem);
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.15;
}

.nomade-body {
  margin: 1rem 0 0;
  font-size: 1.02rem;
  line-height: 1.7;
  color: rgba(17, 17, 17, 0.72);
  white-space: pre-wrap;
}

.nomade-gallery {
  margin-top: 1.75rem;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
}

.nomade-gallery img {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.nomade-form {
  margin-top: 1.75rem;
  display: grid;
  gap: 0.85rem;
  max-width: 28rem;
}

.nomade-submit {
  appearance: none;
  margin-top: 0.35rem;
  background: #111;
  color: #fff;
  border: 0;
  padding: 0.85rem 1.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
}

.nomade-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@keyframes nomade-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes nomade-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes site-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes site-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes site-float {
  0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
  50% { transform: translateY(-10px) rotate(var(--rot, 0deg)); }
}

@keyframes site-bar {
  from {
    opacity: 0;
    transform: scaleY(0.4);
    transform-origin: bottom;
  }
  to {
    opacity: 1;
    transform: scaleY(1);
    transform-origin: bottom;
  }
}

@media (max-width: 640px) {
  .nomade-monogram {
    display: none;
  }

  .nomade-role {
    display: none;
  }

  .nomade-topbar {
    grid-template-columns: auto 1fr;
  }
}
</style>
