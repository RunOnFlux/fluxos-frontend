<template>
  <div>
    <!-- Loading State -->
    <LoadingSpinner
      v-if="initialLoading"
      icon="mdi-help-circle"
      :title="t('pages.administration.support.loadingTitle')"
    />

    <!-- Content -->
    <div v-else>
      <!-- Page Header -->
      <div class="mb-3">
        <div class="d-flex align-center mb-2">
          <VAvatar color="primary" variant="flat" size="48" class="mr-3">
            <VIcon icon="mdi-help-circle" size="32" color="white" />
          </VAvatar>
          <div>
            <h2 class="text-h5 font-weight-bold">{{ t('pages.administration.support.title') }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ t('pages.administration.support.subtitle') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Support Channels -->
      <VRow class="mb-3">
        <!-- Documentation Card -->
        <VCol cols="12" md="4">
          <VCard elevation="2" class="h-100 rounded-lg" style="border: 1px solid rgba(var(--v-border-color), 0.12);">
            <VCardText class="pa-6 d-flex flex-column align-center text-center">
              <VAvatar color="primary" variant="flat" size="64" class="mb-4">
                <VIcon icon="mdi-book-open-variant" size="32" color="white" />
              </VAvatar>
              <h3 class="text-h6 font-weight-bold mb-2">{{ t('pages.administration.support.documentation') }}</h3>
              <p class="text-body-2 text-medium-emphasis mb-5" style="min-height: 48px;">{{ t('pages.administration.support.documentationDesc') }}</p>
              <div class="d-flex flex-column ga-3 w-100">
                <VBtn
                  color="surface-variant"
                  variant="flat"
                  href="https://docs.runonflux.io"
                  target="_blank"
                  class="support-link-btn justify-start text-none"
                >
                  <VIcon icon="mdi-file-document-outline" size="20" class="mr-2" />
                  {{ t('pages.administration.support.completeDocs') }}
                </VBtn>
                <VBtn
                  color="surface-variant"
                  variant="flat"
                  href="https://docs.runonflux.io/fluxos"
                  target="_blank"
                  class="support-link-btn justify-start text-none"
                >
                  <VIcon icon="mdi-book-open-page-variant" size="20" class="mr-2" />
                  {{ t('pages.administration.support.fluxosGuide') }}
                </VBtn>
                <VBtn
                  color="surface-variant"
                  variant="flat"
                  href="https://docs.runonflux.io/api"
                  target="_blank"
                  class="support-link-btn justify-start text-none"
                >
                  <VIcon icon="mdi-api" size="20" class="mr-2" />
                  {{ t('pages.administration.support.apiReference') }}
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Community Support Card -->
        <VCol cols="12" md="4">
          <VCard elevation="2" class="h-100 rounded-lg" style="border: 1px solid rgba(var(--v-border-color), 0.12);">
            <VCardText class="pa-6 d-flex flex-column align-center text-center">
              <VAvatar color="primary" variant="flat" size="64" class="mb-4">
                <VIcon icon="mdi-account-group" size="32" color="white" />
              </VAvatar>
              <h3 class="text-h6 font-weight-bold mb-2">{{ t('pages.administration.support.community') }}</h3>
              <p class="text-body-2 text-medium-emphasis mb-5" style="min-height: 48px;">{{ t('pages.administration.support.communityDesc') }}</p>
              <div class="d-flex flex-column ga-3 w-100">
                <VBtn
                  color="surface-variant"
                  variant="flat"
                  href="https://github.com/RunOnFlux/flux/discussions"
                  target="_blank"
                  class="support-link-btn justify-start text-none"
                >
                  <VIcon icon="mdi-github" size="20" class="mr-2" />
                  {{ t('pages.administration.support.githubDiscussions') }}
                </VBtn>
                <VBtn
                  color="surface-variant"
                  variant="flat"
                  href="https://discord.gg/runonflux"
                  target="_blank"
                  class="support-link-btn justify-start text-none"
                >
                  <VIcon icon="mdi-discord" size="20" class="mr-2" />
                  {{ t('pages.administration.support.discordCommunity') }}
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Direct Support Card -->
        <VCol cols="12" md="4">
          <VCard elevation="2" class="h-100 rounded-lg" style="border: 1px solid rgba(var(--v-border-color), 0.12);">
            <VCardText class="pa-6 d-flex flex-column align-center text-center">
              <VAvatar color="primary" variant="flat" size="64" class="mb-4">
                <VIcon icon="mdi-email" size="32" color="white" />
              </VAvatar>
              <h3 class="text-h6 font-weight-bold mb-2">{{ t('pages.administration.support.directSupport') }}</h3>
              <p class="text-body-2 text-medium-emphasis mb-5" style="min-height: 48px;">{{ t('pages.administration.support.directSupportDesc') }}</p>
              <div class="d-flex flex-column ga-3 w-100">
                <VBtn
                  color="surface-variant"
                  variant="flat"
                  href="https://support.runonflux.io"
                  target="_blank"
                  class="support-link-btn justify-start text-none"
                >
                  <VIcon icon="mdi-ticket-outline" size="20" class="mr-2" />
                  {{ t('pages.administration.support.supportTicketingSystem') }}
                </VBtn>
                <VBtn
                  color="surface-variant"
                  variant="flat"
                  href="mailto:support@runonflux.io"
                  class="support-link-btn justify-start text-none"
                >
                  <VIcon icon="mdi-email-outline" size="20" class="mr-2" />
                  {{ t('pages.administration.support.emailSupport') }}
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Contact Support Form -->
      <VCard elevation="1">
        <VCardTitle class="d-flex align-center pa-3 bg-surface">
          <VIcon icon="mdi-email" size="24" class="mr-2" />
          <span class="text-body-1 font-weight-medium">{{ t('pages.administration.support.contactSupport') }}</span>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-3">
          <VForm
            ref="formRef"
            v-model="formValid"
            @submit.prevent="handleSubmit"
          >
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="formData.email"
                  :label="t('common.labels.email') + ' *'"
                  type="email"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required, rules.email]"
                  :disabled="isSubmitting"
                >
                  <template #prepend-inner>
                    <VIcon icon="mdi-email-outline" size="22" />
                  </template>
                </VTextField>
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="formData.type"
                  :label="t('pages.administration.support.issueType') + ' *'"
                  :items="issueTypes"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  :disabled="isSubmitting"
                >
                  <template #prepend-inner>
                    <VIcon icon="mdi-tag-outline" size="18" />
                  </template>
                </VSelect>
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="formData.subject"
                  :label="t('pages.administration.support.subject') + ' *'"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  :disabled="isSubmitting"
                >
                  <template #prepend-inner>
                    <VIcon icon="mdi-text-short" size="22" />
                  </template>
                </VTextField>
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="formData.description"
                  :label="t('pages.administration.support.description') + ' *'"
                  variant="outlined"
                  rows="6"
                  :rules="[rules.required]"
                  :disabled="isSubmitting"
                >
                  <template #prepend-inner>
                    <VIcon icon="mdi-text" size="22" />
                  </template>
                </VTextarea>
              </VCol>

              <VCol v-if="errorMessage" cols="12">
                <VAlert
                  type="error"
                  variant="outlined"
                  closable
                  :icon="false"
                  @click:close="errorMessage = ''"
                >
                  <div class="d-flex align-center">
                    <VIcon icon="mdi-alert-circle" size="24" class="mr-2" />
                    <div>
                      <div class="font-weight-semibold">{{ t('common.labels.error') }}</div>
                      <div class="text-body-2">{{ errorMessage }}</div>
                    </div>
                  </div>
                </VAlert>
              </VCol>

              <VCol v-if="isSubmitted" cols="12">
                <VAlert
                  type="success"
                  variant="outlined"
                  closable
                  :icon="false"
                  @click:close="isSubmitted = false"
                >
                  <div class="d-flex align-center">
                    <VIcon icon="mdi-check-circle" size="24" class="mr-2" />
                    <div>
                      <div class="font-weight-semibold">{{ t('pages.administration.support.successTitle') }}</div>
                      <div class="text-body-2">{{ t('pages.administration.support.successMessage') }}</div>
                    </div>
                  </div>
                </VAlert>
              </VCol>

              <VCol cols="12">
                <VBtn
                  type="submit"
                  color="primary"
                  variant="flat"
                  block
                  :loading="isSubmitting"
                  :disabled="isSubmitting || !formValid"
                >
                  <VIcon icon="mdi-send" class="mr-2" style="transform: rotate(-45deg) translateY(-2px);" />
                  {{ t('common.buttons.submit') }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSEONoIndex } from '@/composables/useSEO'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'

// Prevent indexing of admin page
useSEONoIndex()

const { t } = useI18n()

// State
const initialLoading = ref(true)
const formRef = ref(null)
const formValid = ref(false)
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const errorMessage = ref('')

// Form data
const formData = ref({
  email: '',
  type: 'General Question',
  subject: '',
  description: '',
})

// Issue types for dropdown
const issueTypes = computed(() => [
  { title: t('pages.administration.support.types.question'), value: 'General question' },
  { title: t('pages.administration.support.types.blockApp'), value: 'Block application' },
  { title: t('pages.administration.support.types.blockPort'), value: 'Block port' },
  { title: t('pages.administration.support.types.reportMalicious'), value: 'Report malicious app' },
  { title: t('pages.administration.support.types.reportIssue'), value: 'Report issue' },
])

// Validation rules
const rules = {
  required: value => !!value || t('common.validation.required'),
  email: value => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || t('common.validation.invalidEmail')
  },
}

// Submit form
const handleSubmit = async () => {
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()
  if (!valid) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('https://relay.ssp.runonflux.io/v1/ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-challenge': 'fluxos-support-form',
      },
      body: JSON.stringify(formData.value),
    })

    const data = await response.json()

    // Check if the API returned an error status
    if (data.status === 'error') {
      throw new Error(data.data?.message || t('pages.administration.support.errorMessage'))
    }

    // Also check HTTP status
    if (!response.ok) {
      throw new Error(data.message || t('pages.administration.support.errorMessage'))
    }

    // Success
    isSubmitted.value = true
    formData.value = {
      email: '',
      type: 'General Question',
      subject: '',
      description: '',
    }
    formRef.value.reset()

    // Auto-hide success message after 6 seconds
    setTimeout(() => {
      isSubmitted.value = false
    }, 6000)
  }
  catch (error) {
    console.error('Error submitting support ticket:', error)
    errorMessage.value = error.message || t('pages.administration.support.errorMessage')

    // Auto-hide error message after 6 seconds
    setTimeout(() => {
      errorMessage.value = ''
    }, 6000)
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // Initialize component
  initialLoading.value = false
})
</script>

<route lang="yaml">
meta:
  privilege:
    - admin
    - fluxteam
</route>

<style scoped>
.progress-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.support-link-btn {
  transition: all 0.2s ease-in-out;
  background-color: rgba(var(--v-theme-on-surface), 0.08) !important;
}

.support-link-btn :deep(.v-btn__content) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.support-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background-color: rgba(var(--v-theme-on-surface), 0.12) !important;
}
</style>
