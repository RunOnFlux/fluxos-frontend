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
      @click="openFluxAI"
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

// The widget is loaded from index.html after app-ready with no launcher of
// its own; this button is its launcher. If it has not mounted yet (a very
// early click), open it on its ready event instead of doing nothing.
const openFluxAI = () => {
  if (window.ownllm) return window.ownllm.open()
  window.addEventListener('ownllm-ready', () => window.ownllm.open(), { once: true })
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
