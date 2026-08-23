<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { MapPin } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TypographyMuted, TypographySmall } from '@/components/typography'
import { usePinPlacement } from '@/views/(space-owner)/map/composables/usePinPlacement'
import type { EstablishmentDraft } from '@/views/(space-owner)/map/types/establishment.types'

const {
  isPlacing,
  isModalOpen,
  pendingPoint,
  startPlacement,
  cancelPlacement,
  closeModal,
  submitPin,
} = usePinPlacement()

const emptyForm: EstablishmentDraft = { name: '', address: '', contactNumber: '', description: '' }
const form = reactive<EstablishmentDraft>({ ...emptyForm })

const canSubmit = computed(() => form.name.trim().length > 0)

watch(isModalOpen, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

function resetForm(): void {
  Object.assign(form, emptyForm)
}

function togglePlacement(): void {
  if (isPlacing.value) {
    cancelPlacement()
    return
  }

  startPlacement()
}

function handleSave(): void {
  if (!canSubmit.value || !submitPin({ ...form })) {
    return
  }

  resetForm()
}
</script>

<template>
  <!-- ── Pin tool button (right side over the map) ──────────────────────── -->
  <button
    type="button"
    class="absolute right-3 top-3 z-900 flex h-10 w-10 items-center justify-center rounded-md border bg-card shadow transition-colors hover:bg-muted"
    :class="isPlacing ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
    aria-label="Add establishment pin"
    @click="togglePlacement"
  >
    <MapPin class="h-5 w-5" />
  </button>

  <!-- ── Placement HUD ───────────────────────────────────────────────────── -->
  <div
    v-if="isPlacing"
    class="absolute left-3 top-24 z-900 rounded-md border bg-card/95 px-3 py-2 shadow"
  >
    <TypographySmall as="p" class="text-xs font-medium">Pin Placement Active</TypographySmall>
    <TypographyMuted as="p" class="text-xs">Click the map to drop your pin.</TypographyMuted>
    <Button size="sm" variant="outline" class="mt-2 w-full" @click="cancelPlacement">
      <TypographySmall as="span">Cancel</TypographySmall>
    </Button>
  </div>

  <!-- ── Establishment form modal ─────────────────────────────────────────── -->
  <Dialog :open="isModalOpen" @update:open="(value) => { if (!value) closeModal() }">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Establishment</DialogTitle>
        <DialogDescription>
          Fill in the details for the location you selected
          <template v-if="pendingPoint">
            ({{ pendingPoint.lat.toFixed(5) }}, {{ pendingPoint.lng.toFixed(5) }})
          </template>
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-3 py-2">
        <div class="space-y-1.5">
          <Label class="text-xs" for="pin-name">Name of Establishment</Label>
          <Input id="pin-name" v-model="form.name" placeholder="e.g. BizNest Coworking Hub" />
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs" for="pin-address">Address</Label>
          <Input id="pin-address" v-model="form.address" placeholder="Street, Barangay, City" />
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs" for="pin-contact">Contact Number</Label>
          <Input id="pin-contact" v-model="form.contactNumber" placeholder="09XX XXX XXXX" />
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs" for="pin-description">Description</Label>
          <Textarea
            id="pin-description"
            v-model="form.description"
            :rows="3"
            placeholder="Tell people what your establishment offers"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeModal">Cancel</Button>
        <Button :disabled="!canSubmit" @click="handleSave">Pin Location</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
