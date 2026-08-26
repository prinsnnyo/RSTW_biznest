<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { UploadCloud } from 'lucide-vue-next'
import { listHazardCategories } from '@/services/hazard/hazard.service'
import {
  uploadHazardAttachment,
  uploadHazardImage,
  uploadHazardPmtiles,
} from '@/services/hazard/hazard-storage.service'
import { parseHazardGeoJsonFile } from '@/utils/hazard/hazardGeoJson.utils'
import { useAdminMapStore } from '@/stores/admin.map.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileDropZone } from '@/components/ui/file-drop-zone'
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  HazardCategory,
  HazardGeometry,
  HazardGeometryType,
  HazardSeverity,
  HazardStatus,
} from '@/types/hazard.types'

type FileDropZoneInstance = InstanceType<typeof FileDropZone>

const severityOptions: HazardSeverity[] = ['low', 'moderate', 'high', 'critical']
const statusOptions: HazardStatus[] = ['reported', 'under_review', 'active', 'mitigated', 'resolved']

const adminMapStore = useAdminMapStore()

const open = computed(() => adminMapStore.showHazardUploadModal)

const form = reactive({
  name: '',
  category_id: '',
  severity: 'low' as HazardSeverity,
  status: 'reported' as HazardStatus,
  description: '',
  hazard_date: '',
  location_name: '',
  address: '',
  barangay: '',
  city: '',
  province: '',
  region: '',
})

const parsedGeometry = ref<{ geometry: HazardGeometry; geometryType: HazardGeometryType } | null>(
  null,
)
const geojsonParseError = ref('')
const imageUrls = ref<string[]>([])
const attachmentUrls = ref<string[]>([])
const pmtilesUrl = ref<string | null>(null)

const geojsonZoneRef = ref<FileDropZoneInstance | null>(null)
const imagesZoneRef = ref<FileDropZoneInstance | null>(null)
const pmtilesZoneRef = ref<FileDropZoneInstance | null>(null)
const attachmentsZoneRef = ref<FileDropZoneInstance | null>(null)

const isAnyDropZoneBusy = computed(() =>
  [geojsonZoneRef, imagesZoneRef, pmtilesZoneRef, attachmentsZoneRef].some(
    (zoneRef) => zoneRef.value?.isBusy,
  ),
)

const fetchedCategories = ref<HazardCategory[]>([])
const isLoadingCategories = ref(false)
const categoryFetchError = ref('')

const resolvedCategories = computed(() =>
  adminMapStore.hazardCategories.length > 0 ? adminMapStore.hazardCategories : fetchedCategories.value,
)

function resetForm(): void {
  form.name = ''
  form.category_id = ''
  form.severity = 'low'
  form.status = 'reported'
  form.description = ''
  form.hazard_date = ''
  form.location_name = ''
  form.address = ''
  form.barangay = ''
  form.city = ''
  form.province = ''
  form.region = ''
  parsedGeometry.value = null
  geojsonParseError.value = ''
  imageUrls.value = []
  attachmentUrls.value = []
  pmtilesUrl.value = null
}

watch(open, async (isOpen) => {
  if (!isOpen) {
    resetForm()
    return
  }

  if (resolvedCategories.value.length > 0) {
    return
  }

  isLoadingCategories.value = true
  categoryFetchError.value = ''
  try {
    fetchedCategories.value = await listHazardCategories()
  } catch (err) {
    categoryFetchError.value = err instanceof Error ? err.message : 'Failed to load categories.'
  } finally {
    isLoadingCategories.value = false
  }
})

const canSubmit = computed(
  () =>
    form.name.trim().length > 0 &&
    form.category_id.length > 0 &&
    !adminMapStore.isUploadingHazard &&
    !isAnyDropZoneBusy.value,
)

async function parseGeoJson(file: File): Promise<string> {
  geojsonParseError.value = ''
  try {
    parsedGeometry.value = await parseHazardGeoJsonFile(file)
  } catch (err) {
    parsedGeometry.value = null
    geojsonParseError.value = err instanceof Error ? err.message : 'Failed to parse GeoJSON file.'
    throw err
  }
  // This slot never uploads anywhere — geometry is parsed client-side and
  // sent with the hazard payload. The drop zone just needs a resolved value
  // to mark the item done; the file name doubles as that.
  return file.name
}

function onGeoJsonResults(results: string[]): void {
  if (results.length === 0) {
    parsedGeometry.value = null
  }
}

function onImageResults(results: string[]): void {
  imageUrls.value = results
}

function onAttachmentResults(results: string[]): void {
  attachmentUrls.value = results
}

function onPmtilesResults(results: string[]): void {
  pmtilesUrl.value = results[0] ?? null
}

function close(): void {
  adminMapStore.closeHazardUploadModal()
}

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  void adminMapStore.handleUploadHazard({
    name: form.name.trim(),
    category_id: form.category_id,
    severity: form.severity,
    status: form.status,
    description: form.description.trim() || null,
    hazard_date: form.hazard_date || null,
    location_name: form.location_name.trim() || null,
    address: form.address.trim() || null,
    barangay: form.barangay.trim() || null,
    city: form.city.trim() || null,
    province: form.province.trim() || null,
    region: form.region.trim() || null,
    geometry: parsedGeometry.value?.geometry,
    geometry_type: parsedGeometry.value?.geometryType,
    images: imageUrls.value,
    attachments: attachmentUrls.value,
    pmtiles_url: pmtilesUrl.value,
  })
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (val) => {
        if (!val) close()
      }
    "
  >
    <DialogScrollContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <UploadCloud class="h-4 w-4" />
          Upload Hazard
        </DialogTitle>
        <DialogDescription>
          Upload a GeoJSON file to define the hazard's geometry, then fill in its details.
        </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium">Hazard Name <span class="text-destructive">*</span></label>
          <Input v-model="form.name" placeholder="e.g. River Flooding" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Category <span class="text-destructive">*</span></label>
          <Select v-model="form.category_id" :disabled="isLoadingCategories">
            <SelectTrigger>
              <SelectValue :placeholder="isLoadingCategories ? 'Loading…' : 'Select category'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="cat in resolvedCategories" :key="cat.id" :value="cat.id">
                {{ cat.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="categoryFetchError" class="text-xs text-destructive">
            {{ categoryFetchError }}
          </p>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Severity</label>
          <Select v-model="form.severity">
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="severity in severityOptions" :key="severity" :value="severity">
                {{ severity }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Hazard Date</label>
          <Input type="date" v-model="form.hazard_date" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Status</label>
          <Select v-model="form.status">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="status in statusOptions" :key="status" :value="status">
                {{ status }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="col-span-2 space-y-1 rounded-md border bg-muted/30 p-3">
          <label class="text-xs font-medium">GeoJSON File</label>
          <FileDropZone
            ref="geojsonZoneRef"
            :upload="parseGeoJson"
            accept=".json,.geojson,application/geo+json,application/json"
            hint="Point, LineString, Polygon, or their Multi variants"
            @update:results="onGeoJsonResults"
          />
          <p class="text-xs text-muted-foreground">
            Optional. Feature, FeatureCollection, or bare geometry are all accepted. Only the
            first feature is used. Skip this to add geometry later.
          </p>
          <p v-if="geojsonParseError" class="text-xs text-destructive">
            {{ geojsonParseError }}
          </p>
        </div>

        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium">Description</label>
          <Textarea v-model="form.description" :rows="3" placeholder="Describe hazard details" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Location Name</label>
          <Input v-model="form.location_name" placeholder="Barangay Doongan" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Address</label>
          <Input v-model="form.address" placeholder="Street / landmark" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Barangay</label>
          <Input v-model="form.barangay" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">City</label>
          <Input v-model="form.city" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Province</label>
          <Input v-model="form.province" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Region</label>
          <Input v-model="form.region" />
        </div>

        <div class="col-span-2 space-y-1">
          <label class="text-xs font-medium">Images</label>
          <FileDropZone
            ref="imagesZoneRef"
            multiple
            accept="image/*"
            :upload="uploadHazardImage"
            @update:results="onImageResults"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">PMTiles File</label>
          <FileDropZone
            ref="pmtilesZoneRef"
            :upload="uploadHazardPmtiles"
            accept=".pmtiles"
            @update:results="onPmtilesResults"
          />
          <p class="text-xs text-muted-foreground">
            Used to render this hazard on the map; geometry stays available for queries.
          </p>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium">Attachments</label>
          <FileDropZone
            ref="attachmentsZoneRef"
            multiple
            :upload="uploadHazardAttachment"
            @update:results="onAttachmentResults"
          />
        </div>

        <p v-if="adminMapStore.hazardUploadError" class="col-span-2 text-xs text-destructive">
          {{ adminMapStore.hazardUploadError }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">Cancel</Button>
        <Button :disabled="!canSubmit" @click="submit">
          {{ adminMapStore.isUploadingHazard ? 'Uploading…' : 'Upload Hazard' }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
