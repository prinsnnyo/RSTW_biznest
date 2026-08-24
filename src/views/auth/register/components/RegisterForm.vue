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
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-vue-next'
import logoImage from '/register.png'
import { Loader2 } from 'lucide-vue-next'

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
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card class="overflow-hidden p-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8" @submit.prevent="handleSubmit">
          <FieldGroup>
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-semibold">Create your account</h1>
              <p class="text-muted-foreground text-sm text-balance">
                Enter your email below to create your account
              </p>
            </div>
            <Field>
              <FieldLabel for="email"> Email </FieldLabel>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="m@example.com"
                autocomplete="email"
                :disabled="isSubmitting"
                required
              />
              <FieldDescription>
                We'll use this to contact you. We will not share your email with anyone else.
              </FieldDescription>
              <FieldError v-if="fieldErrors.email">{{ fieldErrors.email }}</FieldError>
            </Field>
            <Field>
              <FieldLabel for="username"> Username </FieldLabel>
              <Input
                id="username"
                v-model="username"
                type="text"
                placeholder="yourname"
                autocomplete="username"
                :disabled="isSubmitting"
                required
              />
              <FieldError v-if="fieldErrors.username">{{ fieldErrors.username }}</FieldError>
            </Field>
            <Field>
              <FieldLabel for="city"> City </FieldLabel>
              <Combobox
                v-model="cityId"
                open-on-focus
                open-on-click
                :disabled="isFetchingCities || isSubmitting"
              >
                <ComboboxAnchor class="w-full">
                  <ComboboxInput
                    id="city"
                    class="w-full"
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
              <Field class="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel for="password"> Password </FieldLabel>
                  <div class="relative">
                    <Input
                      id="password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      class="pr-10"
                      autocomplete="new-password"
                      :disabled="isSubmitting"
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
                  <FieldError v-if="fieldErrors.password">{{ fieldErrors.password }}</FieldError>
                </Field>
                <Field>
                  <FieldLabel for="confirm-password"> Confirm Password </FieldLabel>
                  <div class="relative">
                    <Input
                      id="confirm-password"
                      v-model="confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="pr-10"
                      autocomplete="new-password"
                      :disabled="isSubmitting"
                      required
                    />
                    <button
                      type="button"
                      class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center"
                      :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <svg
                        v-if="showConfirmPassword"
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
                      <span class="sr-only"
                        >{{ showConfirmPassword ? 'Hide' : 'Show' }} password</span
                      >
                    </button>
                  </div>
                  <FieldError v-if="fieldErrors.confirmPassword">{{
                    fieldErrors.confirmPassword
                  }}</FieldError>
                </Field>
              </Field>
              <FieldDescription> Must be at least 8 characters long. </FieldDescription>
            </Field>
            <Field>
              <Button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Creating account...' : 'Create Account' }}
              </Button>
            </Field>

            <FieldDescription class="text-center">
              Already have an account?
              <RouterLink :to="{ name: 'login' }" class="underline-offset-2 hover:underline"
                >Sign in</RouterLink
              >
            </FieldDescription>
          </FieldGroup>
        </form>
        <div class="bg-muted relative hidden md:flex items-center justify-center overflow-hidden">
          <img
            :src="logoImage"
            alt="BizNest Mascot"
            class="h-full w-full object-contain scale-175"
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
