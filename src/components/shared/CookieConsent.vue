<template>
  <!-- Cookie Settings Dialog - shown on first visit and when managing cookies -->
  <VDialog
    v-model="showSettings"
    max-width="600"
    content-class="cookie-settings-dialog"
    :persistent="isFirstVisit"
  >
    <VCard class="dialog-card">
      <VCardTitle class="d-flex justify-space-between align-center pa-3 dialog-header">
        <div class="d-flex align-center gap-3">
          <VIcon size="28">mdi-cookie</VIcon>
          <span>{{ t('common.cookieConsent.settingsTitle') }}</span>
        </div>
        <VBtn
          icon="mdi-close"
          variant="text"
          size="small"
          class="close-btn"
          @click="closeDialog"
        />
      </VCardTitle>

      <VCardText>
        <div class="mb-4 ml-2">
          <div class="text-body-2 mb-2">
            {{ t('common.cookieConsent.settingsDescription') }}
          </div>
        </div>

        <!-- Necessary Cookies -->
        <div class="cookie-category mb-4">
          <div class="d-flex justify-space-between align-center mb-2">
            <div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ t('common.cookieConsent.necessary') }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t('common.cookieConsent.necessaryDescription') }}
              </div>
            </div>
            <VSwitch
              v-model="necessaryCookiesEnabled"
              disabled
              color="success"
            />
          </div>
        </div>

        <!-- Analytics Cookies -->
        <div class="cookie-category">
          <div class="d-flex justify-space-between align-center mb-2">
            <div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ t('common.cookieConsent.analytics') }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t('common.cookieConsent.analyticsDescription') }}
              </div>
            </div>
            <VSwitch
              v-model="preferences.analytics"
              color="primary"
            />
          </div>
        </div>
      </VCardText>

      <VCardActions class="dialog-actions px-6 pb-4">
        <VBtn
          color="secondary"
          variant="outlined"
          @click="closeDialog"
        >
          {{ t('common.cookieConsent.close') }}
        </VBtn>
        <VSpacer />
        <VBtn
          color="warning"
          variant="tonal"
          @click="acceptNecessary"
        >
          {{ t('common.cookieConsent.onlyNecessary') }}
        </VBtn>
        <VBtn
          color="success"
          variant="flat"
          @click="acceptSelected"
        >
          <VIcon start size="20">mdi-check-circle</VIcon>
          {{ t('common.cookieConsent.accept') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCookieConsent } from '@/composables/useCookieConsent'

const { t } = useI18n()
const {
  getConsent,
  saveConsent,
  hasConsent,
  enableAnalytics,
  disableAnalytics,
} = useCookieConsent()

const showSettings = ref(false)
const isFirstVisit = ref(false)
const necessaryCookiesEnabled = ref(true) // Always true, for display purposes
const preferences = ref({
  analytics: true, // Pre-selected to yes on first visit
})

// Listen for cookie settings open event from StatusBar
const handleOpenCookieSettings = () => {
  // When opening from StatusBar, load current preferences
  const consent = getConsent()
  if (consent) {
    preferences.value.analytics = consent.analytics
  }
  showSettings.value = true
}

onMounted(() => {
  // Show dialog if user hasn't made a choice (first visit)
  if (!hasConsent()) {
    isFirstVisit.value = true
    preferences.value.analytics = true // Pre-select analytics to yes
    showSettings.value = true
  } else {
    // Load existing preferences
    const consent = getConsent()
    preferences.value.analytics = consent.analytics

    // Enable analytics if previously consented
    if (consent.analytics) {
      enableAnalytics()
    }
  }

  // Listen for cookie settings open event
  window.addEventListener('open-cookie-settings', handleOpenCookieSettings)
})

onBeforeUnmount(() => {
  window.removeEventListener('open-cookie-settings', handleOpenCookieSettings)
})

// Accept button - saves whatever is currently selected
const acceptSelected = () => {
  saveConsent({
    necessary: true,
    analytics: preferences.value.analytics,
  })

  if (preferences.value.analytics) {
    enableAnalytics()
  } else {
    disableAnalytics()
  }

  isFirstVisit.value = false
  showSettings.value = false
}

// Only Necessary button - accepts only necessary cookies
const acceptNecessary = () => {
  preferences.value.analytics = false
  saveConsent({
    necessary: true,
    analytics: false,
  })
  disableAnalytics()
  isFirstVisit.value = false
  showSettings.value = false
}

// Close button - closes dialog without saving (no analytics enabled)
const closeDialog = () => {
  // If first visit and closing without saving, don't enable any non-essential cookies
  // This is GDPR compliant - no consent = no cookies
  isFirstVisit.value = false
  showSettings.value = false
}
</script>

<style scoped lang="scss">
.cookie-category {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  padding: 20px;
  background: rgba(var(--v-theme-surface-variant), 0.05);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(var(--v-theme-surface-variant), 0.08);
    border-color: rgba(var(--v-border-color), calc(var(--v-border-opacity) * 1.5));
  }

  .d-flex {
    gap: 16px;
  }
}

.dialog-card {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  :deep(.v-icon) {
    color: rgb(var(--v-theme-on-primary)) !important;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.dialog-actions {
  :deep(.v-btn) {
    min-height: 36px;
  }

  @media (max-width: 600px) {
    flex-wrap: wrap;
    gap: 8px;

    :deep(.v-btn) {
      flex: 1 1 auto;
    }
  }
}
</style>

<style lang="scss">
.cookie-settings-dialog {
  border-radius: 16px;
  overflow: hidden;

  // Ensure cookie dialog appears above reCAPTCHA overlays
  z-index: 9999 !important;
}

// Override Vuetify overlay to ensure it's above reCAPTCHA
.v-overlay.v-dialog {
  &:has(.cookie-settings-dialog) {
    z-index: 9999 !important;

    .v-overlay__scrim {
      z-index: 9998 !important;
    }
  }
}
</style>
