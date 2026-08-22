<script setup lang="ts">
import { ref, type HTMLAttributes } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAlertContext } from '@/composables/useAlert'
import { AuthServiceError, signInWithEmail } from '@/services/auth.service'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import { useAuthStore } from '@/stores/auth.store'
import logoImage from '/login.png'

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

    await router.push(useAuthStore().homeRouteName === 'admin-map' ? '/admin/map' : '/app/map')
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
    <Card class="overflow-hidden p-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8" @submit.prevent="handleSubmit">
          <FieldGroup>
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-semibold">Welcome back!</h1>
              <p class="text-muted-foreground text-balance">Login to your BizNest account</p>
            </div>
            <Field>
              <FieldLabel for="email"> Email </FieldLabel>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="m@example.com"
                autocomplete="email"
                required
              />
            </Field>
            <Field>
              <div class="flex items-center">
                <FieldLabel for="password"> Password </FieldLabel>
                <a href="#" class="ml-auto text-sm underline-offset-2 hover:underline">
                  Forgot your password?
                </a>
              </div>
              <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="pr-10"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <svg
                    v-if="showPassword"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-4 w-4"
                  >
                    <path d="m3 3 18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path
                      d="M9.36 5.37A9.91 9.91 0 0 1 12 5c5 0 9.27 3.11 11 7-1.02 2.29-2.75 4.15-4.93 5.3"
                    />
                    <path
                      d="M6.61 6.61C4.62 7.97 3.05 9.85 2 12c1.73 3.89 6 7 10 7a9.67 9.67 0 0 0 4.12-.93"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-4 w-4"
                  >
                    <path d="M2 12s3.64-7 10-7 10 7 10 7-3.64 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span class="sr-only">{{ showPassword ? 'Hide' : 'Show' }} password</span>
                </button>
              </div>
            </Field>
            <Field>
              <Button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Logging in...' : 'Login' }}
              </Button>
            </Field>

            <FieldDescription class="text-center">
              Don't have an account?
              <RouterLink :to="{ name: 'register' }" class="underline-offset-2 hover:underline"
                >Sign up</RouterLink
              >
            </FieldDescription>
          </FieldGroup>
        </form>
        <div class="bg-muted relative hidden overflow-hidden md:block">
          <DotLottieVue
            src="/map-browsing.lottie"
            autoplay
            loop
            class="absolute inset-0 h-full w-full opacity-90"
            aria-label="Map browsing preview animation"
          />
        </div>
      </CardContent>
    </Card>
    <FieldDescription class="px-6 text-center">
      By clicking continue, you agree to our <a href="#">Terms of Service</a> and
      <a href="#">Privacy Policy</a>.
    </FieldDescription>
  </div>
</template>
