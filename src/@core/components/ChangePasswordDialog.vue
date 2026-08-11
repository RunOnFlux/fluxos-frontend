<script setup>
import { changePassword } from "@/utils/firebase"
import { useI18n } from "vue-i18n"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["update:modelValue", "changed"])

const { t } = useI18n()

const form = ref({ current: "", pw1: "", pw2: "" })
const formRef = ref(null)
const processing = ref(false)
const done = ref(false)
const errorMessage = ref("")

// One toggle per field: revealing the current password and checking a new one
// you just typed are separate needs.
const reveal = ref({ current: false, pw1: false, pw2: false })

const show = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
})

const passwordRules = [
  v => !!v || t("core.login.passwordRequired"),
  v => v.length >= 8 || t("core.login.passwordTooShort"),
]

const currentPasswordRules = [v => !!v || t("core.login.passwordRequired")]

const confirmRules = computed(() => [
  v => !!v || t("core.login.passwordConfirmRequired"),
  v => v === form.value.pw1 || t("core.login.passwordMismatch"),
])

const reset = () => {
  form.value = { current: "", pw1: "", pw2: "" }
  reveal.value = { current: false, pw1: false, pw2: false }
  errorMessage.value = ""
  done.value = false
  formRef.value?.resetValidation()
}

const close = () => {
  show.value = false
}

// Clear the typed passwords as soon as the dialog goes away, so they are not
// sitting in memory behind a closed dialog.
watch(show, opened => {
  if (!opened) reset()
})

const submit = async () => {
  const result = await formRef.value?.validate()
  if (!result.valid) return

  errorMessage.value = ""
  processing.value = true
  try {
    await changePassword(form.value.current, form.value.pw1)
    done.value = true
    emit("changed")
    setTimeout(close, 2000)
  } catch (error) {
    // A failed reauthentication reports the same codes as a failed sign-in.
    // Here the only credential in play is the current password.
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential")
      errorMessage.value = t("core.login.currentPasswordWrong")
    else if (error.code === "auth/requires-recent-login")
      errorMessage.value = t("core.login.requiresRecentLogin")
    else if (error.code === "auth/weak-password")
      errorMessage.value = t("core.login.weakPassword")
    else
      errorMessage.value = t("core.login.changePasswordFailed")
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <VDialog
    v-model="show"
    max-width="500px"
  >
    <VCard>
      <VCardTitle class="bg-primary modal-title">
        {{ t("core.login.changePassword") }}
      </VCardTitle>
      <VCardText>
        <VAlert
          v-if="done"
          type="success"
          variant="tonal"
        >
          {{ t("core.login.changePasswordSuccess") }}
        </VAlert>

        <template v-else>
          <p class="normal-case mb-4">
            {{ t("core.login.changePasswordDesc") }}
          </p>

          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>

          <VForm
            ref="formRef"
            @submit.prevent="submit"
          >
            <VTextField
              v-model="form.current"
              :label="t('core.login.currentPassword')"
              :type="reveal.current ? 'text' : 'password'"
              :append-inner-icon="reveal.current ? 'tabler-eye-off' : 'tabler-eye'"
              autocomplete="current-password"
              :rules="currentPasswordRules"
              validate-on="blur submit"
              required
              class="mb-3"
              @click:append-inner="reveal.current = !reveal.current"
            />
            <VTextField
              v-model="form.pw1"
              :label="t('core.login.newPassword')"
              :type="reveal.pw1 ? 'text' : 'password'"
              :append-inner-icon="reveal.pw1 ? 'tabler-eye-off' : 'tabler-eye'"
              autocomplete="new-password"
              :rules="passwordRules"
              validate-on="blur submit"
              required
              class="mb-3"
              @click:append-inner="reveal.pw1 = !reveal.pw1"
            />
            <VTextField
              v-model="form.pw2"
              :label="t('core.login.confirmNewPassword')"
              :type="reveal.pw2 ? 'text' : 'password'"
              :append-inner-icon="reveal.pw2 ? 'tabler-eye-off' : 'tabler-eye'"
              autocomplete="new-password"
              :rules="confirmRules"
              validate-on="blur submit"
              required
              @click:append-inner="reveal.pw2 = !reveal.pw2"
            />
          </VForm>
        </template>
      </VCardText>
      <VCardActions v-if="!done">
        <VBtn
          color="secondary"
          variant="flat"
          @click="close"
        >
          {{ t("core.login.cancel") }}
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          :disabled="processing"
          @click="submit"
        >
          <VProgressCircular
            v-if="processing"
            indeterminate
            color="white"
            size="20"
          />
          <span v-else>{{ t("core.login.save") }}</span>
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
