<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ClipboardCheck } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TypographyH2, TypographyMuted, TypographySmall } from '@/components/typography'
import { useAlertContext } from '@/composables/useAlert'
import {
  createSignedDocumentUrl,
  documentKindLabel,
  listBusinessApplicationsForAdmin,
  reviewBusinessRoleApplication,
  roleLabel,
} from '@/services/business-role-applications.service'
import type { BusinessRoleApplication } from '@/types/business-role-application.types'

const { showSuccess, showAlert } = useAlertContext()

const applications = ref<BusinessRoleApplication[]>([])
const isLoading = ref(true)
const selected = ref<BusinessRoleApplication | null>(null)
const reviewNotes = ref('')
const isSaving = ref(false)
const statusFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')

const filteredApplications = computed(() => {
  if (statusFilter.value === 'all') {
    return applications.value
  }
  return applications.value.filter((application) => application.status === statusFilter.value)
})

const pendingCount = computed(
  () => applications.value.filter((application) => application.status === 'pending').length,
)

const loadApplications = async (): Promise<void> => {
  isLoading.value = true
  try {
    applications.value = await listBusinessApplicationsForAdmin()
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

const openApplication = (application: BusinessRoleApplication): void => {
  selected.value = application
  reviewNotes.value = application.review_notes ?? ''
}

const openDocument = async (path: string): Promise<void> => {
  try {
    const url = await createSignedDocumentUrl(path)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    showAlert({
      title: 'Could not open file',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  }
}

const decide = async (decision: 'approved' | 'rejected'): Promise<void> => {
  if (!selected.value) {
    return
  }

  isSaving.value = true
  try {
    const updated = await reviewBusinessRoleApplication(
      selected.value.id,
      decision,
      reviewNotes.value,
    )
    applications.value = applications.value.map((application) =>
      application.id === updated.id ? { ...application, ...updated } : application,
    )
    selected.value = null
    showSuccess(
      decision === 'approved'
        ? 'The applicant can now use that business role after they refresh or sign in again.'
        : 'The application was rejected.',
      { title: decision === 'approved' ? 'Approved' : 'Rejected' },
    )
  } catch (error) {
    showAlert({
      title: 'Review failed',
      description: error instanceof Error ? error.message : 'Please try again.',
      tone: 'destructive',
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadApplications()
})
</script>

<template>
  <section class="w-full space-y-5 p-4 md:p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <span class="bg-primary/10 text-primary mt-0.5 rounded-lg p-2.5">
          <ClipboardCheck class="h-5 w-5" />
        </span>
        <div class="space-y-1">
          <TypographyH2>Business applications</TypographyH2>
          <TypographyMuted>
            Review business details and legal documents, then approve or reject each request.
          </TypographyMuted>
        </div>
      </div>
      <Badge variant="secondary" class="bg-primary/10 text-primary shrink-0 border-none px-3 py-1">
        {{ pendingCount }} pending
      </Badge>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button
        v-for="option in (['pending', 'approved', 'rejected', 'all'] as const)"
        :key="option"
        size="sm"
        :variant="statusFilter === option ? 'default' : 'outline'"
        @click="statusFilter = option"
      >
        {{ option }}
      </Button>
    </div>

    <Card class="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead class="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="5" class="text-muted-foreground">Loading…</TableCell>
          </TableRow>
          <TableRow v-else-if="filteredApplications.length === 0">
            <TableCell colspan="5" class="text-muted-foreground">
              No applications in this filter.
            </TableCell>
          </TableRow>
          <TableRow v-for="application in filteredApplications" :key="application.id">
            <TableCell>
              <div class="font-medium">{{ application.business_name }}</div>
              <TypographySmall class="text-muted-foreground">{{
                application.contact_phone
              }}</TypographySmall>
            </TableCell>
            <TableCell>{{ roleLabel(application.requested_role) }}</TableCell>
            <TableCell>
              <Badge variant="secondary">{{ application.status }}</Badge>
            </TableCell>
            <TableCell>{{ new Date(application.created_at).toLocaleString() }}</TableCell>
            <TableCell class="text-right">
              <Button size="sm" variant="outline" @click="openApplication(application)">
                Review
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <Dialog :open="selected !== null" @update:open="(open) => !open && (selected = null)">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ selected?.business_name }}</DialogTitle>
        </DialogHeader>

        <div v-if="selected" class="space-y-3 text-sm">
          <p><strong>Requested role:</strong> {{ roleLabel(selected.requested_role) }}</p>
          <p><strong>Phone:</strong> {{ selected.contact_phone }}</p>
          <p><strong>Address:</strong> {{ selected.business_address }}</p>
          <p v-if="selected.registration_number">
            <strong>DTI / SEC:</strong> {{ selected.registration_number }}
          </p>
          <p v-if="selected.tin"><strong>TIN:</strong> {{ selected.tin }}</p>
          <p><strong>About:</strong> {{ selected.business_description }}</p>

          <div class="space-y-2">
            <strong>Documents</strong>
            <ul v-if="selected.documents?.length" class="space-y-1">
              <li v-for="doc in selected.documents" :key="doc.id">
                <button
                  type="button"
                  class="text-primary underline-offset-2 hover:underline"
                  @click="openDocument(doc.storage_path)"
                >
                  {{ documentKindLabel(doc.document_kind) }} — {{ doc.file_name }}
                </button>
              </li>
            </ul>
            <p v-else class="text-muted-foreground">No files attached.</p>
          </div>

          <div v-if="selected.status === 'pending'" class="space-y-2">
            <Label for="review-notes">Notes (optional, shown if you reject)</Label>
            <Textarea id="review-notes" v-model="reviewNotes" :rows="3" />
          </div>
          <p v-else-if="selected.review_notes">
            <strong>Review notes:</strong> {{ selected.review_notes }}
          </p>
        </div>

        <DialogFooter v-if="selected?.status === 'pending'">
          <Button variant="outline" :disabled="isSaving" @click="decide('rejected')">Reject</Button>
          <Button :disabled="isSaving" @click="decide('approved')">Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
