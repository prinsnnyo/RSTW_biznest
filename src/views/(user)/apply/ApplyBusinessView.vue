<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Building2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { TypographyH2, TypographyMuted, TypographySmall } from '@/components/typography'
import { useAlertContext } from '@/composables/useAlert'
import { useAuthStore } from '@/stores/auth.store'
import {
  documentKindLabel,
  listMyBusinessApplications,
  roleLabel,
  submitBusinessRoleApplication,
} from '@/services/business-role-applications.service'
import { BUSINESS_ROLE_OPTIONS, type BusinessRole } from '@/types/pinned-location.types'
import {
  DOCUMENT_KIND_OPTIONS,
  type BusinessDocumentKind,
  type BusinessRoleApplication,
} from '@/types/business-role-application.types'

const authStore = useAuthStore()
const { showSuccess, showAlert } = useAlertContext()

const applications = ref<BusinessRoleApplication[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const requestedRole = ref<BusinessRole>('space_owner')
const businessName = ref('')
const businessAddress = ref('')
const businessDescription = ref('')
const contactPhone = ref('')
const registrationNumber = ref('')
const tin = ref('')
const files = ref<File[]>([])
const documentKind = ref<BusinessDocumentKind>('valid_id')

const pendingApplication = computed(() =>
  applications.value.find((application) => application.status === 'pending'),
)
const latestApplication = computed(() => applications.value[0] ?? null)
const alreadyBusinessUser = computed(() => authStore.isBusinessUser)

const statusLabel = (status: BusinessRoleApplication['status']): string => {
  if (status === 'pending') return 'Pending review'
  if (status === 'approved') return 'Approved'
  return 'Rejected'
}

const loadApplications = async (): Promise<void> => {
  isLoading.value = true
  try {
    applications.value = await listMyBusinessApplications()
  } catch (error) {
    showAlert({
      title: 'Could not load applications',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const onFilesChosen = (event: Event): void => {
  const input = event.target as HTMLInputElement
  files.value = input.files ? Array.from(input.files) : []
}

const handleSubmit = async (): Promise<void> => {
  if (alreadyBusinessUser.value || pendingApplication.value) {
    return
  }

  isSubmitting.value = true
  try {
    await submitBusinessRoleApplication({
      requested_role: requestedRole.value,
      business_name: businessName.value,
      business_address: businessAddress.value,
      business_description: businessDescription.value,
      contact_phone: contactPhone.value,
      registration_number: registrationNumber.value,
      tin: tin.value,
      documents: files.value.map((file) => ({ file, kind: documentKind.value })),
    })
    showSuccess('Your application was sent to the super admin for review.', {
      title: 'Application submitted',
    })
    businessName.value = ''
    businessAddress.value = ''
    businessDescription.value = ''
    contactPhone.value = ''
    registrationNumber.value = ''
    tin.value = ''
    files.value = []
    await loadApplications()
  } catch (error) {
    showAlert({
      title: 'Application failed',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void loadApplications()
})
</script>

<template>
  <section class="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-6">
    <div class="flex items-start gap-3">
      <span class="bg-primary/10 text-primary mt-0.5 rounded-lg p-2.5">
        <Building2 class="h-5 w-5" />
      </span>
      <div class="space-y-1">
        <TypographyH2>Become a business partner</TypographyH2>
        <TypographyMuted>
          New accounts start as regular users. Apply here to become a Space Owner, Entrepreneur, or
          Supplier. A super admin will check your business details and legal documents before
          approving.
        </TypographyMuted>
      </div>
    </div>

    <Card v-if="alreadyBusinessUser" class="p-5">
      <p class="text-sm">
        Your account is already approved as
        <strong>{{ roleLabel(authStore.businessRole as BusinessRole) }}</strong
        >. You can use the business tools in your sidebar.
      </p>
    </Card>

    <Card v-else-if="latestApplication" class="space-y-2 p-5">
      <div class="flex items-center justify-between gap-3">
        <TypographySmall class="font-medium">Latest application</TypographySmall>
        <Badge variant="secondary">{{ statusLabel(latestApplication.status) }}</Badge>
      </div>
      <p class="text-muted-foreground text-sm">
        {{ roleLabel(latestApplication.requested_role) }} · {{ latestApplication.business_name }}
      </p>
      <p v-if="latestApplication.status === 'pending'" class="text-sm">
        The super admin has not reviewed this yet. You cannot submit another application until they
        decide.
      </p>
      <p v-if="latestApplication.status === 'rejected'" class="text-sm">
        This application was rejected.
        <span v-if="latestApplication.review_notes">
          Reason: {{ latestApplication.review_notes }}
        </span>
        You may submit a new application below.
      </p>
    </Card>

    <Card v-if="!alreadyBusinessUser && !pendingApplication" class="p-5">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="requested-role">Apply as</Label>
          <Select v-model="requestedRole">
            <SelectTrigger id="requested-role" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in BUSINESS_ROLE_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="business-name">Business name</Label>
          <Input id="business-name" v-model="businessName" required :disabled="isSubmitting" />
        </div>

        <div class="space-y-2">
          <Label for="contact-phone">Contact phone</Label>
          <Input id="contact-phone" v-model="contactPhone" required :disabled="isSubmitting" />
        </div>

        <div class="space-y-2">
          <Label for="business-address">Business address</Label>
          <Input
            id="business-address"
            v-model="businessAddress"
            required
            :disabled="isSubmitting"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="registration-number">DTI / SEC number (optional)</Label>
            <Input
              id="registration-number"
              v-model="registrationNumber"
              :disabled="isSubmitting"
            />
          </div>
          <div class="space-y-2">
            <Label for="tin">TIN (optional)</Label>
            <Input id="tin" v-model="tin" :disabled="isSubmitting" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="business-description">About the business</Label>
          <Textarea
            id="business-description"
            v-model="businessDescription"
            :rows="5"
            required
            :disabled="isSubmitting"
          />
        </div>

        <div class="space-y-2">
          <Label for="document-kind">Document type</Label>
          <Select v-model="documentKind">
            <SelectTrigger id="document-kind" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in DOCUMENT_KIND_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="documents">Legal documents</Label>
          <Input
            id="documents"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            :disabled="isSubmitting"
            @change="onFilesChosen"
          />
          <TypographyMuted>
            Upload a valid ID plus permit or DTI/SEC papers. PDF or images, 10 MB each.
          </TypographyMuted>
          <ul v-if="files.length" class="text-muted-foreground list-disc pl-5 text-sm">
            <li v-for="file in files" :key="file.name">
              {{ documentKindLabel(documentKind) }} — {{ file.name }}
            </li>
          </ul>
        </div>

        <Button type="submit" :disabled="isSubmitting || isLoading">
          {{ isSubmitting ? 'Submitting…' : 'Submit for review' }}
        </Button>
      </form>
    </Card>
  </section>
</template>
