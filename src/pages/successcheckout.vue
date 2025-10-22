<script setup>
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import miscMaskDark from '@images/pages/misc-mask-dark.png'
import miscMaskLight from '@images/pages/misc-mask-light.png'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)

// Auto-close window after 10 seconds (only if popup)
const closeTimer = ref(10)
const cannotClose = ref(false)
const isPopup = ref(false)

onMounted(() => {
  // Check if this window was opened as a popup
  isPopup.value = window.opener !== null

  // Only start countdown if it's a popup
  if (isPopup.value) {
    const interval = setInterval(() => {
      closeTimer.value--
      if (closeTimer.value <= 0) {
        clearInterval(interval)

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
        Payment Completed Successfully! 🎉
      </h1>
      <p class="text-body-1 text-center text-medium-emphasis" style="max-width: 600px;">
        Your application payment has been processed successfully.
        <br>
        <span class="text-warning">It can take up to 45 minutes</span> for your application to be deployed on the Flux network.
      </p>
      <p v-if="isPopup && closeTimer > 0" class="text-body-1 text-center text-medium-emphasis mt-4">
        This window will close automatically in <span class="text-primary font-weight-bold">{{ closeTimer }}</span> seconds
      </p>
      <p v-else-if="isPopup && cannotClose" class="text-body-1 text-center text-medium-emphasis mt-4">
        You can safely close this window now
      </p>
      <p v-else-if="!isPopup" class="text-body-1 text-center text-medium-emphasis mt-4">
        You can safely close this window now
      </p>
    </div>

    <!-- Footer Image -->
    <img
      class="misc-footer-img d-none d-md-block"
      :src="authThemeMask"
      alt="misc-footer-img"
      height="320"
    >
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>
