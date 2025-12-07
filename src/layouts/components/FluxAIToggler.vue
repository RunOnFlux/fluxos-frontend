<template>
  <div class="flux-ai-toggler">
    <!-- Icon button on mobile only (< md) -->
    <IconBtn class="d-md-none" @click="openFluxAI">
      <VIcon
        icon="mdi-chat-processing"
        size="22"
      />
      <VTooltip activator="parent" location="bottom">
        {{ t('components.fluxAIToggler.tooltip') }}
      </VTooltip>
    </IconBtn>

    <!-- Original button on desktop (>= md) - UNCHANGED -->
    <VBtn
      id="flux-ai-button"
      variant="outlined"
      color="grey"
      size="small"
      class="d-none d-md-flex align-center"
    >
      <VIcon
        icon="mdi-chat-processing"
        size="20"
        class="me-1"
      />
      <span>{{ t('components.fluxAIToggler.askFluxAI') }}</span>
      <VTooltip activator="parent" location="bottom">
        {{ t('components.fluxAIToggler.tooltip') }}
      </VTooltip>
    </VBtn>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const openFluxAI = () => {
  // Trigger the same click as desktop button
  const desktopBtn = document.getElementById('flux-ai-button')
  if (desktopBtn) {
    desktopBtn.click()
  }
}
</script>

<style scoped>
#flux-ai-button {
  text-transform: none;
  letter-spacing: normal;
}

/* Make button fit icon only on smaller screens */
@media (max-width: 1279px) {
  #flux-ai-button {
    min-width: auto !important;
    padding: 0 8px !important;
  }
}
</style>
