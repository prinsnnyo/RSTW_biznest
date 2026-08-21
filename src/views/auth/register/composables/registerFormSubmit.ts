import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  confirmedValidator,
  emailValidator,
  passwordValidator,
  requiredValidator,
} from '@/utils/validators'
import { useAlertContext } from '@/composables/useAlert'
import { AuthServiceError, signUpWithEmail } from '@/services/auth.service'
import type { CityOption } from '@/services/cities.service'

export interface UseRegisterFormReturn {
  // Form fields
  email: Ref<string>
  username: Ref<string>
  cityId: Ref<string>
  password: Ref<string>
  confirmPassword: Ref<string>

  // UI state
  showPassword: Ref<boolean>
  showConfirmPassword: Ref<boolean>
  isSubmitting: Ref<boolean>
  errorMessage: Ref<string>

  // Validation state
  touched: Ref<{
    email: boolean
    username: boolean
    city: boolean
    password: boolean
    confirmPassword: boolean
  }>
  fieldErrors: Ref<{
    email: string | null
    username: string | null
    city: string | null
    password: string | null
    confirmPassword: string | null
  }>

  // Computed
  selectedCityName: ComputedRef<string>

  // Methods
  getCityDisplayValue: (val: unknown) => string
  updateEmailError: () => void
  updateUsernameError: () => void
  updateCityError: () => void
  updatePasswordError: () => void
  updateConfirmPasswordError: () => void
  updateAllFieldErrors: () => void
  handleSubmit: () => Promise<void>
}

export interface UseRegisterFormOptions {
  cities: Ref<CityOption[]>
  isFetchingCities: Ref<boolean>
  router: ReturnType<typeof useRouter>
}

export function useRegisterFormSubmit({
  cities,
  router,
}: UseRegisterFormOptions): UseRegisterFormReturn {
  const { showAlert, showSuccess } = useAlertContext()

  // Form fields
  const email = ref('')
  const username = ref('')
  const cityId = ref('')
  const password = ref('')
  const confirmPassword = ref('')

  // UI state
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref('')

  // Validation state
  const touched = ref({
    email: false,
    username: false,
    city: false,
    password: false,
    confirmPassword: false,
  })

  const fieldErrors = ref({
    email: null as string | null,
    username: null as string | null,
    city: null as string | null,
    password: null as string | null,
    confirmPassword: null as string | null,
  })

  // Computed
  const selectedCityName = computed(() => {
    if (!cityId.value) {
      return ''
    }
    return cities.value.find((city) => city.id === cityId.value)?.name ?? ''
  })

  // Helper functions
  const getValidatorMessage = (result: boolean | string): string | null => {
    if (result === true) return null
    return typeof result === 'string' ? result : 'Invalid value'
  }

  const validateField = (...results: Array<boolean | string>): string | null => {
    for (const result of results) {
      const message = getValidatorMessage(result)
      if (message) return message
    }
    return null
  }

  const getCityDisplayValue = (val: unknown): string => {
    if (typeof val !== 'string' || !val) return ''
    return cities.value.find((city) => city.id === val)?.name ?? ''
  }

  // Validation update functions
  const updateEmailError = (): void => {
    fieldErrors.value.email = touched.value.email
      ? validateField(requiredValidator(email.value), emailValidator(email.value))
      : null
  }

  const updateUsernameError = (): void => {
    fieldErrors.value.username = touched.value.username
      ? validateField(requiredValidator(username.value))
      : null
  }

  const updateCityError = (): void => {
    fieldErrors.value.city = touched.value.city
      ? validateField(requiredValidator(cityId.value))
      : null
  }

  const updatePasswordError = (): void => {
    fieldErrors.value.password = touched.value.password
      ? validateField(requiredValidator(password.value), passwordValidator(password.value))
      : null
  }

  const updateConfirmPasswordError = (): void => {
    fieldErrors.value.confirmPassword = touched.value.confirmPassword
      ? validateField(
          requiredValidator(confirmPassword.value),
          confirmedValidator(confirmPassword.value, password.value),
        )
      : null
  }

  const updateAllFieldErrors = (): void => {
    updateEmailError()
    updateUsernameError()
    updateCityError()
    updatePasswordError()
    updateConfirmPasswordError()
  }

  const getFirstFieldError = (): string | null => {
    return (
      fieldErrors.value.email ||
      fieldErrors.value.username ||
      fieldErrors.value.city ||
      fieldErrors.value.password ||
      fieldErrors.value.confirmPassword ||
      null
    )
  }

  // Watch for field changes to update validation
  watch(email, () => {
    if (!touched.value.email) touched.value.email = true
    if (isSubmitting.value) return
    updateEmailError()
  })

  watch(username, () => {
    if (!touched.value.username) touched.value.username = true
    if (isSubmitting.value) return
    updateUsernameError()
  })

  watch(cityId, () => {
    if (!touched.value.city) touched.value.city = true
    if (isSubmitting.value) return
    updateCityError()
  })

  watch(password, () => {
    if (!touched.value.password) touched.value.password = true
    if (isSubmitting.value) return
    updatePasswordError()
    updateConfirmPasswordError()
  })

  watch(confirmPassword, () => {
    if (!touched.value.confirmPassword) touched.value.confirmPassword = true
    if (isSubmitting.value) return
    updateConfirmPasswordError()
  })

  // Form submission
  const handleSubmit = async (): Promise<void> => {
    errorMessage.value = ''

    touched.value.email = true
    touched.value.username = true
    touched.value.city = true
    touched.value.password = true
    touched.value.confirmPassword = true
    updateAllFieldErrors()

    const firstError = getFirstFieldError()
    if (firstError) {
      errorMessage.value = firstError
      return
    }

    isSubmitting.value = true

    try {
      const inviteQuery = router.currentRoute.value.query.invite
      const inviteToken = typeof inviteQuery === 'string' ? inviteQuery : undefined

      const response = await signUpWithEmail({
        username: username.value,
        email: email.value.toLowerCase(), // Convert email to lowercase before submitting
        password: password.value,
        city_id: cityId.value,
        city_name: selectedCityName.value,
        inviteToken,
      })

      if (response.session) {
        showSuccess('Your account has been created and you are now signed in.', {
          title: 'Account created',
        })
        await router.push('/')
        return
      }

      showSuccess('Check your inbox to confirm your email before signing in.', {
        title: 'Account created',
        durationMs: 4500,
      })
      await router.push('/login')

      password.value = ''
      confirmPassword.value = ''
    } catch (error) {
      if (error instanceof AuthServiceError) {
        showAlert({
          title: 'Registration error',
          description: error.message,
          tone: 'destructive',
        })
        return
      }

      if (error instanceof Error) {
        showAlert({
          title: 'Registration error',
          description: error.message,
          tone: 'destructive',
        })
        return
      }

      showAlert({
        title: 'Registration error',
        description: 'Unable to create your account right now.',
        tone: 'destructive',
      })
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    // Form fields
    email,
    username,
    cityId,
    password,
    confirmPassword,

    // UI state
    showPassword,
    showConfirmPassword,
    isSubmitting,
    errorMessage,

    // Validation state
    touched,
    fieldErrors,

    // Computed
    selectedCityName,

    // Methods
    getCityDisplayValue,
    updateEmailError,
    updateUsernameError,
    updateCityError,
    updatePasswordError,
    updateConfirmPasswordError,
    updateAllFieldErrors,
    handleSubmit,
  }
}
