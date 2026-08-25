<script setup lang="ts">
import { ref, type HTMLAttributes } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAlertContext } from '@/composables/useAlert'
import { AuthServiceError, signInWithEmail } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { Eye, EyeOff } from 'lucide-vue-next'
import AuthSplitCard from '@/views/auth/components/AuthSplitCard.vue'
import AuthLoginMapPreview from '@/views/auth/components/AuthLoginMapPreview.vue'

const AUTH_INPUT = 'h-11 rounded-xl bg-background/50 px-3.5'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const router = useRouter()
const { showAlert, showSuccess } = useAlertContext()
const showPassword = ref(false)
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

const showErrorAlert = (description: string, title = 'Login failed'): void => {
  showAlert({
    title,
    description,
    tone: 'destructive',
  })
}

const handleSubmit = async (): Promise<void> => {
  if (!email.value || !password.value) {
    showErrorAlert('Please enter your email and password.', 'Missing credentials')
    return
  }

  isSubmitting.value = true

  try {
    await signInWithEmail({
      email: email.value,
      password: password.value,
    })

    showSuccess('You are now signed in to your BizNest account.', {
      title: 'Login successful',
    })

    await router.push({ name: useAuthStore().homeRouteName })
  } catch (error) {
    if (error instanceof AuthServiceError) {
      showErrorAlert(error.message)
      return
    }

    if (error instanceof Error) {
      showErrorAlert(error.message)
      return
    }

    showErrorAlert('Unable to sign in right now.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <AuthSplitCard>
      <template #form>
        <form @submit.prevent="handleSubmit">
          <FieldGroup>
            <div class="mb-2 space-y-2">
              <p class="text-primary text-xs font-semibold tracking-[0.22em] uppercase">Welcome</p>
              <h1 class="text-foreground text-3xl font-semibold tracking-tight">Welcome back</h1>
              <p class="text-muted-foreground text-sm text-pretty">
                Sign in to pick up your map, pins, and partner tools.
              </p>
            </div>
            <Field>
              <FieldLabel for="email">Email</FieldLabel>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="you@biznest.app"
                autocomplete="email"
                :class="AUTH_INPUT"
                required
              />
            </Field>
            <Field>
              <div class="flex items-center">
                <FieldLabel for="password">Password</FieldLabel>
                <a
                  href="#"
                  class="text-primary ml-auto text-sm font-medium underline-offset-4 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :class="cn(AUTH_INPUT, 'pr-11')"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="size-4" />
                  <Eye v-else class="size-4" />
                </button>
              </div>
            </Field>
            <Field>
              <Button
                type="submit"
                :disabled="isSubmitting"
                class="h-12 w-full rounded-full text-base font-semibold shadow-lg shadow-accent/25 transition hover:scale-[1.015]"
              >
                {{ isSubmitting ? 'Signing you in…' : 'Sign in' }}
              </Button>
            </Field>

            <FieldDescription class="text-center">
              New to BizNest?
              <RouterLink
                :to="{ name: 'register' }"
                class="text-primary font-medium underline-offset-4 hover:underline"
              >
                Create an account
              </RouterLink>
            </FieldDescription>
          </FieldGroup>
        </form>
      </template>
      <template #visual>
        <AuthLoginMapPreview />
      </template>
    </AuthSplitCard>
    <FieldDescription class="px-2 text-center">
      By continuing you agree to our
      <a href="#" class="text-foreground font-medium underline-offset-4 hover:underline">Terms</a>
      and
      <a href="#" class="text-foreground font-medium underline-offset-4 hover:underline">Privacy Policy</a>.
    </FieldDescription>
  </div>
</template>
