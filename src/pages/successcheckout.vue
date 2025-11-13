<script setup>
import { useI18n } from 'vue-i18n'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { useSEONoIndex } from '@/composables/useSEO'
import miscMaskDark from '@images/pages/misc-mask-dark.png'
import miscMaskLight from '@images/pages/misc-mask-light.png'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const { t } = useI18n()
const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)

// Prevent indexing of success checkout confirmation page
useSEONoIndex()

// Auto-close window after 10 seconds (only if popup)
const closeTimer = ref(10)
const cannotClose = ref(false)
const isPopup = ref(false)
const closeInterval = ref(null)

onMounted(() => {
  // Check if this window was opened as a popup
  isPopup.value = window.opener !== null

  // Only start countdown if it's a popup
  if (isPopup.value) {
    closeInterval.value = setInterval(() => {
      closeTimer.value--
      if (closeTimer.value <= 0) {
        clearInterval(closeInterval.value)
        closeInterval.value = null

        // Try to close the window
        window.close()

        // If window didn't close (blocked by browser), show message after a brief delay
        setTimeout(() => {
          if (!window.closed) {
            cannotClose.value = true
          }
        }, 100)
      }
    }, 1000)
  }
})

// Cleanup on unmount to prevent memory leaks
onBeforeUnmount(() => {
  if (closeInterval.value) {
    clearInterval(closeInterval.value)
    closeInterval.value = null
  }
})
</script>

<template>
  <div class="misc-wrapper">
    <!-- Success Header -->
    <div class="misc-header d-flex flex-column align-center gap-2 mb-8">
      <VIcon
        icon="mdi-check-circle"
        color="success"
        size="80"
        class="mb-2"
      />
      <h1 class="text-h4 font-weight-bold text-center">
        {{ t('pages.successCheckout.title') }}
      </h1>
      <p class="text-body-1 text-center text-medium-emphasis" style="max-width: 600px;">
        {{ t('pages.successCheckout.paymentProcessed') }}
        <br>
        <span class="text-warning">{{ t('pages.successCheckout.deploymentTime') }}</span> {{ t('pages.successCheckout.deploymentMessage') }}
      </p>
      <p v-if="isPopup && closeTimer > 0" class="text-body-1 text-center text-medium-emphasis mt-4">
        {{ t('pages.successCheckout.autoCloseMessage', { seconds: closeTimer }) }}
      </p>
      <p v-else-if="isPopup && cannotClose" class="text-body-1 text-center text-medium-emphasis mt-4">
        {{ t('pages.successCheckout.safeToClose') }}
      </p>
      <p v-else-if="!isPopup" class="text-body-1 text-center text-medium-emphasis mt-4">
        {{ t('pages.successCheckout.safeToClose') }}
      </p>
    </div>

    <!-- Footer Image -->
    <img
      class="misc-footer-img d-none d-md-block"
      :src="authThemeMask"
      :alt="t('pages.successCheckout.footerImageAlt')"
      height="320"
      loading="lazy"
    >
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>
