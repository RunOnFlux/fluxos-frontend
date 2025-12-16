<template>
  <!-- Cookie Settings Dialog - shown on first visit and when managing cookies -->
  <VDialog
    v-model="showSettings"
    max-width="600"
    content-class="cookie-settings-dialog"
    @click:outside="handleClickOutside"
  >
    <VCard class="dialog-card">
      <VCardTitle class="d-flex justify-space-between align-center pa-3 dialog-header">
        <div class="d-flex align-center gap-3">
          <VIcon size="28">mdi-cookie</VIcon>
          <span>{{ t('common.cookieConsent.settingsTitle') }}</span>
        </div>
        <VBtn
          v-if="!isFirstVisit"
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
          v-if="!isFirstVisit"
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
          @click.stop="acceptNecessary"
        >
          {{ t('common.cookieConsent.onlyNecessary') }}
        </VBtn>
        <VBtn
          color="success"
          variant="flat"
          @click.stop="acceptSelected"
        >
          <VIcon start size="20">mdi-check-circle</VIcon>
          {{ t('common.cookieConsent.accept') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
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

/**
 * Check if the current hostname is an IP address (IPv4 or IPv6)
 * Used to skip cookie consent dialog when accessing via IP:port
 */
const isIPAddress = () => {
  const hostname = window.location.hostname

  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/

  // IPv6 pattern (simplified - covers most cases including localhost)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^::1$|^\[.*\]$/

  // Also check for localhost
  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname) || hostname === 'localhost'
}

const showSettings = ref(false)
const isFirstVisit = ref(false)
const necessaryCookiesEnabled = ref(true) // Always true, for display purposes
const preferences = ref({
  analytics: true, // Pre-selected to yes on first visit
})
let appReadyTimeout = null // Store timeout reference for cleanup

// Listen for cookie settings open event from StatusBar
const handleOpenCookieSettings = () => {
  // When opening from StatusBar, load current preferences
  const consent = getConsent()
  if (consent) {
    preferences.value.analytics = consent.analytics
  }
  showSettings.value = true
}

// Handle app-ready event to show dialog after loader
const handleAppReady = async () => {
  // Clear any existing timeout
  if (appReadyTimeout) clearTimeout(appReadyTimeout)

  // Wait for loader to fade out completely (1 second after app-ready)
  appReadyTimeout = setTimeout(async () => {
    // Skip cookie consent dialog when accessing via IP:port (direct node access)
    // Analytics are not needed for direct node access
    if (isIPAddress()) {
      return
    }

    // Show dialog if user hasn't made a choice (first visit)
    if (!hasConsent()) {
      isFirstVisit.value = true
      preferences.value.analytics = true // Pre-select analytics to yes

      // Wait for Vue to update reactive state
      await nextTick()

      // Show dialog after state is ready
      showSettings.value = true

      // Wait one more tick to ensure dialog is fully rendered with event handlers
      await nextTick()
    } else {
      // Load existing preferences
      const consent = getConsent()
      preferences.value.analytics = consent.analytics

      // Enable analytics if previously consented
      if (consent.analytics) {
        enableAnalytics()
      }
    }
  }, 1000) // 1000ms delay after app-ready to ensure loader has faded out
}

onMounted(() => {
  // Listen for app-ready event (fired after loader completes)
  window.addEventListener('app-ready', handleAppReady)

  // Listen for cookie settings open event
  window.addEventListener('open-cookie-settings', handleOpenCookieSettings)
})

onBeforeUnmount(() => {
  // Clear timeout to prevent memory leak
  if (appReadyTimeout) clearTimeout(appReadyTimeout)
  window.removeEventListener('app-ready', handleAppReady)
  window.removeEventListener('open-cookie-settings', handleOpenCookieSettings)
})

// Accept button - saves whatever is currently selected
const acceptSelected = () => {
  // CRITICAL: Set isFirstVisit to false IMMEDIATELY to prevent handleClickOutside from reopening
  isFirstVisit.value = false

  // Save to localStorage
  saveConsent({
    necessary: true,
    analytics: preferences.value.analytics,
  })

  if (preferences.value.analytics) {
    enableAnalytics()
  } else {
    disableAnalytics()
  }

  // Close dialog
  showSettings.value = false
}

// Only Necessary button - accepts only necessary cookies
const acceptNecessary = () => {
  // CRITICAL: Set isFirstVisit to false IMMEDIATELY to prevent handleClickOutside from reopening
  isFirstVisit.value = false

  preferences.value.analytics = false

  // Save to localStorage
  saveConsent({
    necessary: true,
    analytics: false,
  })
  disableAnalytics()

  // Close dialog
  showSettings.value = false
}

// Handle clicking outside dialog
const handleClickOutside = event => {
  // Prevent closing dialog on first visit by clicking outside
  if (isFirstVisit.value) {
    // Prevent the event from closing the dialog
    event?.preventDefault()
    event?.stopPropagation()

    // Force dialog to stay open - Vuetify may have already closed it
    // Use nextTick to ensure this runs after Vuetify's internal handler
    // Re-check isFirstVisit to handle race condition with button clicks
    nextTick(() => {
      if (isFirstVisit.value) {
        showSettings.value = true
      }
    })

    return false
  }
  closeDialog()
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
