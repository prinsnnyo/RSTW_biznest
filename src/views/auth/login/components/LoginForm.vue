<script setup lang="ts">
import { ref, type HTMLAttributes } from 'vue'
import { useRouter } from 'vue-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldGroup } from '@/components/ui/field'
import { useAlertContext } from '@/composables/useAlert'
import { useAuthStore, type DemoLoginRole } from '@/stores/auth.store'
import {
  Building2,
  Package,
  Shield,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-vue-next'
import AuthSplitCard from '@/views/auth/components/AuthSplitCard.vue'
import AuthLoginMapPreview from '@/views/auth/components/AuthLoginMapPreview.vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const router = useRouter()
const authStore = useAuthStore()
const { showAlert, showSuccess } = useAlertContext()
const isSubmitting = ref(false)
const pendingRole = ref<DemoLoginRole | null>(null)

type RoleOption = {
  role: DemoLoginRole
  label: string
  description: string
  icon: typeof UserRound
}

const roleOptions: RoleOption[] = [
  {
    role: 'user',
    label: 'Normal User',
    description: 'Browse maps and run basic analysis.',
    icon: UserRound,
  },
  {
    role: 'entrepreneur',
    label: 'Entrepreneur',
    description: 'Partner tools, site builder, and messages.',
    icon: Store,
  },
  {
    role: 'space_owner',
    label: 'Space Owner',
    description: 'List and manage spaces on the map.',
    icon: Building2,
  },
  {
    role: 'supplier',
    label: 'Supplier',
    description: 'Supplier partner workspace.',
    icon: Package,
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Admin map and operations console.',
    icon: Shield,
  },
  {
    role: 'superadmin',
    label: 'Super Admin',
    description: 'Full admin access including applications.',
    icon: ShieldCheck,
  },
]

const showErrorAlert = (description: string, title = 'Login failed'): void => {
  showAlert({
    title,
    description,
    tone: 'destructive',
  })
}

const handleRoleLogin = async (role: DemoLoginRole): Promise<void> => {
  isSubmitting.value = true
  pendingRole.value = role

  try {
    await authStore.loginAsRole(role)

    const label = roleOptions.find((option) => option.role === role)?.label ?? role
    showSuccess(`Signed in as ${label}.`, {
      title: 'Login successful',
    })

    await router.push({ name: authStore.homeRouteName })
  } catch (error) {
    if (error instanceof Error) {
      showErrorAlert(error.message)
      return
    }

    showErrorAlert('Unable to sign in right now.')
  } finally {
    isSubmitting.value = false
    pendingRole.value = null
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <AuthSplitCard>
      <template #form>
        <FieldGroup>
          <div class="mb-2 space-y-2">
            <p class="text-primary text-xs font-semibold tracking-[0.22em] uppercase">Welcome</p>
            <h1 class="text-foreground text-3xl font-semibold tracking-tight">Continue as</h1>
            <p class="text-muted-foreground text-sm text-pretty">
              Some of the features are not available due to the database being out of free tokens
            </p>
          </div>

          <div class="grid gap-2.5">
            <Button
              v-for="option in roleOptions"
              :key="option.role"
              type="button"
              variant="outline"
              :disabled="isSubmitting"
              class="h-auto w-full justify-start gap-3 rounded-xl px-3.5 py-3 text-left shadow-none"
              @click="handleRoleLogin(option.role)"
            >
              <span
                class="bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-lg"
              >
                <component :is="option.icon" class="size-4" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="text-foreground block text-sm font-semibold">
                  {{
                    pendingRole === option.role && isSubmitting
                      ? 'Signing you in…'
                      : option.label
                  }}
                </span>
                <span class="text-muted-foreground block text-xs text-pretty">
                  {{ option.description }}
                </span>
              </span>
            </Button>
          </div>
        </FieldGroup>
      </template>
      <template #visual>
        <AuthLoginMapPreview />
      </template>
    </AuthSplitCard>
    <FieldDescription class="px-2 text-center">
      Demo login only — choose a role above to explore each workspace.
    </FieldDescription>
  </div>
</template>
