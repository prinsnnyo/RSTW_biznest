import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listUsers } from '@/services/user-management.service'
import type { UserRow } from '@/views/(admin)/users/types/users-table.types'
import { resolveDisplayRole } from '@/utils/roles.utils'

export const useUserManagementStore = defineStore('userManagement', () => {
  const users = ref<UserRow[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    const { users: fetchedUsers, error: fetchError } = await listUsers()

    if (fetchError) {
      error.value = fetchError
      isLoading.value = false
      return
    }

    users.value = fetchedUsers.map((user) => {
      const metadata = user.raw_user_meta_data ?? {}
      const city =
        user.city ??
        user.city_name ??
        metadata.city_name ??
        metadata.cityName ??
        metadata.city ??
        ''
      const cityId = metadata.city_id ?? undefined

      return {
        id: user.id,
        username: user.full_name ?? user.email ?? 'Unknown',
        email: user.email ?? '',
        role: resolveDisplayRole(
          typeof metadata.role === 'string' ? metadata.role : user.role,
          typeof metadata.business_role === 'string' ? metadata.business_role : null,
        ),
        city,
        cityId,
      }
    })

    isLoading.value = false
  }

  return { users, isLoading, error, fetchUsers }
})
