<script setup lang="ts">
import { onMounted, ref, type HTMLAttributes } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { cn } from '@/lib/utils'
import { useRegisterFormSubmit } from '../composables/registerFormSubmit'
import { fetchPhilippineCities } from '@/services/cities.service'
import type { CityOption } from '@/services/cities.service'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
} from '@/components/ui/combobox'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import AuthSplitCard from '@/views/auth/components/AuthSplitCard.vue'
import AuthRegisterMapPreview from '@/views/auth/components/AuthRegisterMapPreview.vue'

const AUTH_INPUT = 'h-11 rounded-xl bg-background/50 px-3.5'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const router = useRouter()

// Form state
const cities = ref<CityOption[]>([])
const isFetchingCities = ref(false)

// Use the form submission composable
const {
  email,
  username,
  cityId,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  isSubmitting,
  fieldErrors,
  getCityDisplayValue,
  handleSubmit,
} = useRegisterFormSubmit({
  cities,
  isFetchingCities,
  router,
})

// Fetch cities on mount
const fetchCities = async (): Promise<void> => {
  if (cities.value.length > 0) {
    return
  }

  isFetchingCities.value = true

  try {
    cities.value = await fetchPhilippineCities()
  } catch {
    // Error handling is done in the composable via showAlert
    console.log('Error fetching cities, handled in composable')
  } finally {
    isFetchingCities.value = false
  }
}

onMounted(() => {
  void fetchCities()
})

// Re-export handleSubmit for the form submit event
// The composable's handleSubmit is already bound to the form state
</script>

<template>
  <div :class="cn('register-page flex flex-col gap-6', props.class)">
    <AuthSplitCard>
      <template #form>
        <form class="register-form" @submit.prevent="handleSubmit">
          <FieldGroup class="register-stagger">
            <div class="mb-1 space-y-2">
              <p class="text-primary text-xs font-semibold tracking-[0.22em] uppercase">Join BizNest</p>
              <h1 class="text-foreground text-3xl font-semibold tracking-tight">Create your account</h1>
              <p class="text-muted-foreground text-sm text-pretty">
                Start as a member. Partner plans come later when you are ready to list.
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
                :disabled="isSubmitting"
                required
              />
              <FieldDescription>
                We only use this to reach you about your account.
              </FieldDescription>
              <FieldError v-if="fieldErrors.email">{{ fieldErrors.email }}</FieldError>
            </Field>
            <Field>
              <FieldLabel for="username">Username</FieldLabel>
              <Input
                id="username"
                v-model="username"
                type="text"
                placeholder="yourname"
                autocomplete="username"
                :class="AUTH_INPUT"
                :disabled="isSubmitting"
                required
              />
              <FieldError v-if="fieldErrors.username">{{ fieldErrors.username }}</FieldError>
            </Field>
            <Field>
              <FieldLabel for="city">City</FieldLabel>
              <Combobox
                v-model="cityId"
                open-on-focus
                open-on-click
                :disabled="isFetchingCities || isSubmitting"
              >
                <ComboboxAnchor class="w-full">
                  <ComboboxInput
                    id="city"
                    class="h-11 w-full rounded-xl bg-background/50"
                    placeholder="Select a city"
                    :display-value="getCityDisplayValue"
                    :disabled="isFetchingCities || isSubmitting"
                  />
                </ComboboxAnchor>

                <ComboboxList
                  align="start"
                  class="max-h-75 w-(--reka-combobox-trigger-width) overflow-y-auto"
                >
                  <div v-if="isFetchingCities" class="text-muted-foreground p-3 text-sm">
                    <Loader2 class="mr-2 inline-block h-4 w-4 animate-spin" />
                    Loading cities...
                  </div>

                  <template v-else>
                    <ComboboxEmpty>No cities found.</ComboboxEmpty>

                    <ComboboxItem
                      v-for="city in cities"
                      :key="city.id"
                      :value="city.id"
                      :text-value="city.name"
                    >
                      <span>{{ city.name }}</span>
                      <ComboboxItemIndicator>
                        <Check class="h-4 w-4" />
                      </ComboboxItemIndicator>
                    </ComboboxItem>
                  </template>
                </ComboboxList>
              </Combobox>
              <FieldError v-if="fieldErrors.city">{{ fieldErrors.city }}</FieldError>
            </Field>
            <Field>
              <Field class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel for="password">Password</FieldLabel>
                  <div class="relative">
                    <Input
                      id="password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      :class="cn(AUTH_INPUT, 'pr-11')"
                      autocomplete="new-password"
                      :disabled="isSubmitting"
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
                  <FieldError v-if="fieldErrors.password">{{ fieldErrors.password }}</FieldError>
                </Field>
                <Field>
                  <FieldLabel for="confirm-password">Confirm password</FieldLabel>
                  <div class="relative">
                    <Input
                      id="confirm-password"
                      v-model="confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      :class="cn(AUTH_INPUT, 'pr-11')"
                      autocomplete="new-password"
                      :disabled="isSubmitting"
                      required
                    />
                    <button
                      type="button"
                      class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center"
                      :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <EyeOff v-if="showConfirmPassword" class="size-4" />
                      <Eye v-else class="size-4" />
                    </button>
                  </div>
                  <FieldError v-if="fieldErrors.confirmPassword">{{
                    fieldErrors.confirmPassword
                  }}</FieldError>
                </Field>
              </Field>
              <FieldDescription>Must be at least 8 characters.</FieldDescription>
            </Field>
            <Field>
              <Button
                type="submit"
                :disabled="isSubmitting"
                class="register-cta h-12 w-full rounded-full text-base font-semibold shadow-lg shadow-accent/25 transition hover:scale-[1.02]"
              >
                {{ isSubmitting ? 'Creating your account…' : 'Create account' }}
              </Button>
            </Field>

            <FieldDescription class="text-center">
              Already have an account?
              <RouterLink
                :to="{ name: 'login' }"
                class="text-primary font-medium underline-offset-4 hover:underline"
              >
                Sign in
              </RouterLink>
            </FieldDescription>
          </FieldGroup>
        </form>
      </template>
      <template #visual>
        <AuthRegisterMapPreview />
      </template>
    </AuthSplitCard>
    <FieldDescription class="register-legal px-2 text-center">
      By continuing you agree to our
      <a href="#" class="text-foreground font-medium underline-offset-4 hover:underline">Terms</a>
      and
      <a href="#" class="text-foreground font-medium underline-offset-4 hover:underline">Privacy Policy</a>.
    </FieldDescription>
  </div>
</template>

<style scoped>
.register-page {
  animation: register-fade 0.45s ease both;
}

.register-stagger > * {
  animation: register-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.register-stagger > *:nth-child(1) {
  animation-delay: 0.05s;
}
.register-stagger > *:nth-child(2) {
  animation-delay: 0.11s;
}
.register-stagger > *:nth-child(3) {
  animation-delay: 0.17s;
}
.register-stagger > *:nth-child(4) {
  animation-delay: 0.23s;
}
.register-stagger > *:nth-child(5) {
  animation-delay: 0.29s;
}
.register-stagger > *:nth-child(6) {
  animation-delay: 0.35s;
}
.register-stagger > *:nth-child(7) {
  animation-delay: 0.41s;
}

.register-legal {
  animation: register-fade 0.5s ease 0.5s both;
}

.register-cta {
  animation: register-glow 2.8s ease-in-out infinite;
}

@keyframes register-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes register-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes register-glow {
  0%,
  100% {
    box-shadow: 0 12px 28px -8px color-mix(in oklab, var(--accent) 35%, transparent);
  }
  50% {
    box-shadow: 0 16px 36px -6px color-mix(in oklab, var(--accent) 55%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .register-page,
  .register-stagger > *,
  .register-legal,
  .register-cta {
    animation: none;
  }
}
</style>
