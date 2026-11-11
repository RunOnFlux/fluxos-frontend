<template>
  <VContainer>
    <VCard variant="outlined" class="mt-2">
      <VCardText>
        <div class="d-flex align-center mb-1">
          <h4 class="text-h6">{{ t('components.fluxDrive.expiryEmail.title') }}</h4>
          <VProgressCircular
            v-if="subscriptionEmailLoading"
            indeterminate
            size="20"
            width="2"
            class="ms-3"
          />
        </div>

        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ t('components.fluxDrive.expiryEmail.description') }}
        </p>

        <VAlert
          v-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
          closable
          @click:close="loadError = ''"
        >
          {{ loadError }}
        </VAlert>

        <VForm @submit.prevent="save">
          <div class="d-flex align-start flex-wrap gap-2">
            <VTextField
              v-model="emailInput"
              type="email"
              autocomplete="email"
              density="compact"
              :label="t('components.fluxDrive.expiryEmail.label')"
              :placeholder="t('components.fluxDrive.expiryEmail.placeholder')"
              :error-messages="inputError"
              :disabled="subscriptionEmailLoading || busy"
              class="expiry-email-input"
              @update:model-value="inputError = ''"
            />
            <VBtn
              type="submit"
              color="primary"
              :loading="subscriptionEmailSaving && !removing"
              :disabled="subscriptionEmailLoading || busy || !changed"
            >
              {{ t('components.fluxDrive.expiryEmail.save') }}
            </VBtn>
            <VBtn
              v-if="subscriptionEmail"
              variant="tonal"
              color="error"
              :loading="removing"
              :disabled="subscriptionEmailLoading || busy"
              @click="remove"
            >
              {{ t('components.fluxDrive.expiryEmail.remove') }}
            </VBtn>
          </div>
        </VForm>

        <div v-if="subscriptionEmail" class="text-body-2 text-medium-emphasis">
          {{ t('components.fluxDrive.expiryEmail.current', { email: subscriptionEmail }) }}
        </div>
        <div v-else-if="!subscriptionEmailLoading && !loadError" class="text-body-2 text-warning">
          {{ t('components.fluxDrive.expiryEmail.none') }}
        </div>
      </VCardText>
    </VCard>
  </VContainer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFluxDrive } from '@/composables/useFluxDrive'
import { useSnackbar } from '@/composables/useSnackbar'
import { normalizeFluxDriveEmail } from '@/utils/fluxDriveEmail'

const { t } = useI18n()
const { showSnackbar } = useSnackbar()

const {
  subscriptionEmail,
  subscriptionEmailLoading,
  subscriptionEmailSaving,
  fetchSubscriptionEmail,
  saveSubscriptionEmail,
} = useFluxDrive()

const emailInput = ref('')
const inputError = ref('')
const loadError = ref('')
const removing = ref(false)

const busy = computed(() => subscriptionEmailSaving.value)
const changed = computed(() => emailInput.value.trim() !== subscriptionEmail.value)

const save = async () => {
  const email = normalizeFluxDriveEmail(emailInput.value)
  if (!email) {
    inputError.value = t('components.fluxDrive.expiryEmail.invalid')

    return
  }
  try {
    emailInput.value = await saveSubscriptionEmail(email)
    showSnackbar(t('components.fluxDrive.expiryEmail.saved'), 'success')
  } catch (error) {
    showSnackbar(error.message, 'error')
  }
}

const remove = async () => {
  removing.value = true
  try {
    emailInput.value = await saveSubscriptionEmail('')
    showSnackbar(t('components.fluxDrive.expiryEmail.removed'), 'success')
  } catch (error) {
    showSnackbar(error.message, 'error')
  } finally {
    removing.value = false
  }
}

onMounted(async () => {
  try {
    emailInput.value = await fetchSubscriptionEmail()
  } catch (error) {
    loadError.value = error.message
  }
})
</script>

<style scoped>
.expiry-email-input {
  flex: 1 1 280px;
  min-width: 0;
}
</style>
