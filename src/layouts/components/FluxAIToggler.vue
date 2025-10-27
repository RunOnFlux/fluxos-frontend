<template>
  <VBtn
    id="flux-ai-button"
    variant="outlined"
    color="grey"
    size="small"
    class="d-flex align-center"
  >
    <VIcon
      start
      icon="mdi-chat-processing"
      size="20"
    />
    <span class="d-none d-lg-inline">{{ t('components.fluxAIToggler.askFluxAI') }}</span>
    <VTooltip activator="parent" location="bottom">
      {{ t('components.fluxAIToggler.tooltip') }}
    </VTooltip>
  </VBtn>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
#flux-ai-button {
  text-transform: none;
  letter-spacing: normal;
}
</style>
