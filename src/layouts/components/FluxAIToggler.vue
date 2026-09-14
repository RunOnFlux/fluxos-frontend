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

// This button is the assistant's launcher (the widget renders none of its
// own). index.html preloads the widget after app-ready when this button is
// already rendered; when it is not - toolbar mounted later, after login, on a
// different layout - nothing had loaded it and the click did nothing. So the
// button loads it itself on first use, then opens it when it reports ready.
const loadFluxAI = () => {
  if (document.getElementById('flux-ai-widget-script')) return
  const s = document.createElement('script')
  s.defer = true
  s.id = 'flux-ai-widget-script'
  s.src = 'https://ownllmrouter.app.runonflux.io/widget.js'
  s.setAttribute('data-title', 'Ask Flux AI')
  s.setAttribute('data-subject', 'Flux')
  s.setAttribute('data-accent', '#7367F0')
  s.setAttribute('data-button-hide', 'true')
  s.setAttribute('data-suggestions', 'How do I deploy an application on Flux?|What are the resource limits per node tier?|How much does an app cost per month?|How do I update a running application?')
  document.body.appendChild(s)
}

const openFluxAI = () => {
  if (window.ownllm) return window.ownllm.open()
  window.addEventListener('ownllm-ready', () => window.ownllm.open(), { once: true })
  loadFluxAI()
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
