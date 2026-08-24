<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TypographyMuted } from '@/components/typography'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserRow } from '@/views/(admin)/users/types/users-table.types'
import { updateUserProfile } from '@/services/users.service'
import { useAlertContext } from '@/composables/useAlert'
import { fetchPhilippineCities } from '@/services/cities.service'
import type { CityOption } from '@/services/cities.service'
import { useRolesStore } from '@/stores/roles.store'
import { canonicalizeRole, formatRoleLabel, toRoleKey } from '@/utils/roles.utils'
import { Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  isOpen: boolean
  user: UserRow | null
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', val: boolean): void
  (e: 'refresh'): void
  (e: 'updated', user: UserRow): void
}>()

const { showSuccess, showAlert } = useAlertContext()

const rolesStore = useRolesStore()
const { roles, isLoading: isFetchingRoles } = storeToRefs(rolesStore)

const username = ref('')
const email = ref('')
const role = ref('user')
const cityId = ref('')
const legacyCityName = ref('')
const isLoading = ref(false)

const PHILIPPINE_CITIES = ref<CityOption[]>([])
const isFetchingCities = ref(false)

// Every role defined in the `roles` table, plus the user's current role when it
// is no longer listed there, so an existing assignment is never silently dropped.
const roleOptions = computed<string[]>(() => {
  const options: string[] = []
  const seen = new Set<string>()

  const addOption = (value: string): void => {
    const trimmed = value.trim()
    const key = toRoleKey(trimmed)

    if (!trimmed || seen.has(key)) {
      return
    }

    seen.add(key)
    options.push(canonicalizeRole(trimmed))
  }

  addOption(role.value)
  roles.value.forEach((roleRow) => addOption(roleRow.title))

  return options
})

const selectRole = (nextRole: string): void => {
  role.value = canonicalizeRole(nextRole)
}

const selectedCityName = computed(() => {
  if (!cityId.value) {
    return legacyCityName.value
  }

  return PHILIPPINE_CITIES.value.find((city) => city.id === cityId.value)?.name ?? cityId.value
})

const syncCityIdFromUser = (user: UserRow | null): void => {
  if (!user) {
    cityId.value = ''
    legacyCityName.value = ''
    return
  }

  if (user.cityId) {
    cityId.value = user.cityId
    legacyCityName.value = ''
    return
  }

  if (user.city) {
    const matchingCity = PHILIPPINE_CITIES.value.find(
      (option) => option.name.toLowerCase() === user.city.toLowerCase(),
    )
    cityId.value = matchingCity?.id ?? ''
    legacyCityName.value = matchingCity ? '' : user.city
    return
  }

  cityId.value = ''
  legacyCityName.value = ''
}

const fetchCities = async () => {
  if (PHILIPPINE_CITIES.value.length > 0) return
  try {
    isFetchingCities.value = true
    PHILIPPINE_CITIES.value = await fetchPhilippineCities()
    syncCityIdFromUser(props.user)
  } catch (error) {
    console.error('Error fetching cities:', error)
  } finally {
    isFetchingCities.value = false
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchCities()
      void rolesStore.loadRoles()
    }
  },
  { immediate: true },
)

watch(
  () => props.user,
  (user) => {
    if (user) {
      username.value = user.username
      email.value = user.email
      role.value = canonicalizeRole(user.role)
      syncCityIdFromUser(user)
    } else {
      username.value = ''
      email.value = ''
      role.value = 'user'
      cityId.value = ''
    }
  },
  { immediate: true },
)

const closeModal = () => {
  if (isLoading.value) return
  emit('update:isOpen', false)
}

const selectCity = (nextCityId: string): void => {
  cityId.value = nextCityId
  legacyCityName.value = ''
}

const saveChanges = async () => {
  if (!props.user) return

  const resolvedCityId = cityId.value || props.user.cityId || ''
  const resolvedCityName = selectedCityName.value || props.user.city || ''
  const shouldUpdateCityId = resolvedCityId.length > 0
  const shouldUpdateCityName = resolvedCityName.length > 0

  try {
    isLoading.value = true
    await updateUserProfile(props.user.id, {
      username: username.value,
      role: role.value,
      city: shouldUpdateCityName ? resolvedCityName : undefined,
      cityId: shouldUpdateCityId ? resolvedCityId : undefined,
    })

    // Fast local update
    emit('updated', {
      ...props.user,
      username: username.value,
      role: role.value,
      city: selectedCityName.value || props.user.city,
      cityId: resolvedCityId || undefined,
    })

    emit('update:isOpen', false)
    showSuccess('User profile updated successfully.')
  } catch (error) {
    console.error('Failed to update user:', error)
    emit('update:isOpen', false)
    showAlert({
      title: 'Update Failed',
      description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      tone: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog
    :open="props.isOpen"
    @update:open="
      (val) => {
        if (!isLoading) emit('update:isOpen', val)
      }
    "
  >
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit User Profile</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <Input id="username" placeholder="Username" v-model="username" :disabled="isLoading" />
        </div>

        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" placeholder="Email" v-model="email" disabled />
          <TypographyMuted as="p" class="mt-0 text-xs"
            >Email addresses cannot be changed here.</TypographyMuted
          >
        </div>

        <div class="grid gap-2">
          <Label for="role">Role</Label>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                id="role"
                variant="outline"
                class="w-full justify-start font-normal"
                :class="!role && 'text-muted-foreground'"
                :disabled="isLoading"
              >
                {{ role ? formatRoleLabel(role) : 'Select a role' }}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="max-h-[300px] w-[375px] overflow-y-auto">
              <TypographyMuted
                v-if="isFetchingRoles && roleOptions.length === 0"
                as="div"
                class="mt-0 p-4 text-center text-sm"
              >
                <Loader2 class="mr-2 inline-block h-4 w-4 animate-spin" />
                Loading roles...
              </TypographyMuted>
              <TypographyMuted
                v-else-if="roleOptions.length === 0"
                as="div"
                class="mt-0 p-4 text-center text-sm"
              >
                No roles available.
              </TypographyMuted>
              <template v-else>
                <DropdownMenuItem
                  v-for="option in roleOptions"
                  :key="option"
                  @click="selectRole(option)"
                >
                  {{ formatRoleLabel(option) }}
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div class="grid gap-2">
          <Label for="city">City</Label>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                id="city"
                variant="outline"
                class="w-full justify-start font-normal"
                :class="!cityId && 'text-muted-foreground'"
                :disabled="isLoading"
              >
                {{ selectedCityName ? selectedCityName : 'Select a city' }}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-[375px] max-h-[300px] overflow-y-auto">
              <TypographyMuted
                v-if="isFetchingCities"
                as="div"
                class="mt-0 p-4 text-center text-sm"
              >
                <Loader2 class="mr-2 h-4 w-4 animate-spin inline-block" />
                Loading cities...
              </TypographyMuted>
              <template v-else>
                <DropdownMenuItem
                  v-for="c in PHILIPPINE_CITIES"
                  :key="c.id"
                  @click="selectCity(c.id)"
                >
                  {{ c.name }}
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" @click="closeModal" :disabled="isLoading">Cancel</Button>
        <Button @click="saveChanges" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
