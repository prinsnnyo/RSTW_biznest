<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TypographyMuted } from '@/components/typography'
import type { UserRow } from '@/views/(admin)/users/types/users-table.types'
import { formatRoleLabel, getRoleBadgeVariant } from '@/utils/roles.utils'
import { Loader2, Pencil, Trash2 } from 'lucide-vue-next'
import EditModal from './EditModal.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import { deleteUserById } from '@/services/users.service'
import { useAlertContext } from '@/composables/useAlert'

const props = withDefaults(
  defineProps<{
    rows?: UserRow[]
    isLoading?: boolean
  }>(),
  {
    rows: () => [],
    isLoading: false,
  },
)

const pageSize = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(props.rows.length / pageSize)))
const hasRows = computed(() => props.rows.length > 0)

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return props.rows.slice(start, start + pageSize)
})

type VisiblePageItem = number | 'ellipsis-left' | 'ellipsis-right'

const visiblePages = computed<VisiblePageItem[]>(() => {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', total]
  }

  if (current >= total - 3) {
    return [1, 'ellipsis-left', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, 'ellipsis-left', current - 1, current, current + 1, 'ellipsis-right', total]
})

const setPage = (page: number): void => {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

const previousPage = (): void => setPage(currentPage.value - 1)
const nextPage = (): void => setPage(currentPage.value + 1)

watch(
  () => props.rows,
  () => {
    currentPage.value = 1
  },
)

// Modal State
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)

// Data State for Modals
const selectedUserToEdit = ref<UserRow | null>(null)
const selectedUserToDelete = ref<UserRow | null>(null)

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'userDeleted', id: string): void
  (e: 'userUpdated', user: UserRow): void
}>()

const openEditModal = (row: UserRow) => {
  selectedUserToEdit.value = { ...row } // clone to avoid direct mutation
  editModalOpen.value = true
}

const openDeleteModal = (row: UserRow) => {
  selectedUserToDelete.value = row
  deleteModalOpen.value = true
}

const onRefresh = () => {
  emit('refresh')
}

const onUserDeleted = (id: string) => {
  emit('userDeleted', id)
}

const { showSuccess } = useAlertContext()

const deleteAction = async () => {
  if (!selectedUserToDelete.value) return
  const id = selectedUserToDelete.value.id
  await deleteUserById(id)
  onUserDeleted(id)
  showSuccess('User deleted successfully.')
}

const onUserUpdated = (user: UserRow) => {
  emit('userUpdated', user)
}
</script>

<template>
  <div class="space-y-4">
    <div class="overflow-hidden rounded-xl border bg-background">
      <Table class="min-w-[780px] text-left text-sm bg-card/80">
        <TableHeader>
          <TableRow class="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <TableHead class="px-4 py-3 font-medium">ID</TableHead>
            <TableHead class="px-4 py-3 font-medium">Name</TableHead>
            <TableHead class="px-4 py-3 font-medium">Email</TableHead>
            <TableHead class="px-4 py-3 font-medium">City</TableHead>
            <TableHead class="px-4 py-3 font-medium">Role</TableHead>
            <TableHead class="px-4 py-3 text-right font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow v-if="props.isLoading">
            <TableCell colspan="6" class="px-4 py-10 text-center text-muted-foreground">
              <span class="inline-flex items-center gap-2">
                <Loader2 class="size-4 animate-spin" />
                Loading users...
              </span>
            </TableCell>
          </TableRow>

          <TableRow v-for="row in paginatedRows" v-else :key="row.id" class="hover:bg-muted/20">
            <TableCell class="px-4 py-3 font-medium">{{ row.id }}</TableCell>
            <TableCell class="px-4 py-3">{{ row.username }}</TableCell>
            <TableCell class="px-4 py-3 text-muted-foreground">{{ row.email }}</TableCell>
            <TableCell class="px-4 py-3">{{ row.city }}</TableCell>
            <TableCell class="px-4 py-3">
              <Badge :variant="getRoleBadgeVariant(row.role)">{{
                formatRoleLabel(row.role)
              }}</Badge>
            </TableCell>
            <TableCell class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" @click="openEditModal(row)">
                  <Pencil class="size-4" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" @click="openDeleteModal(row)">
                  <Trash2 class="size-4" />
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>

          <TableRow v-if="!props.isLoading && !hasRows">
            <TableCell colspan="6" class="px-4 py-10 text-center text-muted-foreground">
              <TypographyMuted as="p" class="mt-0">No users found.</TypographyMuted>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Pagination v-if="!props.isLoading && hasRows" class="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            :class="currentPage === 1 ? 'pointer-events-none opacity-50' : ''"
            @click.prevent="previousPage"
          />
        </PaginationItem>

        <PaginationItem v-for="pageItem in visiblePages" :key="String(pageItem)">
          <PaginationEllipsis
            v-if="pageItem === 'ellipsis-left' || pageItem === 'ellipsis-right'"
          />
          <PaginationLink
            v-else
            href="#"
            :is-active="currentPage === pageItem"
            @click.prevent="setPage(pageItem)"
          >
            {{ pageItem }}
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationNext
            href="#"
            :class="currentPage === totalPages ? 'pointer-events-none opacity-50' : ''"
            @click.prevent="nextPage"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>

  <EditModal
    v-model:isOpen="editModalOpen"
    :user="selectedUserToEdit"
    @refresh="onRefresh"
    @updated="onUserUpdated"
  />
  <ConfirmDeleteModal
    v-model:isOpen="deleteModalOpen"
    :item-name="selectedUserToDelete?.username"
    item-type="user"
    :action="deleteAction"
    @refresh="onRefresh"
  />
</template>

<style scoped></style>
