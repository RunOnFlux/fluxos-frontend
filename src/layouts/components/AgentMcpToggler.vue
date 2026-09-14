<template>
  <div class="agent-mcp-toggler">
    <!-- Icon button on mobile only (< md) -->
    <IconBtn class="d-md-none" @click="dialog = true">
      <VIcon icon="tabler-robot" size="22" />
      <VTooltip activator="parent" location="bottom">
        {{ t('components.agentMcpToggler.tooltip') }}
      </VTooltip>
    </IconBtn>

    <!-- Button on desktop (>= md) -->
    <VBtn
      id="agent-mcp-button"
      variant="outlined"
      color="grey"
      size="small"
      class="d-none d-md-flex align-center"
      @click="dialog = true"
    >
      <VIcon icon="tabler-robot" size="20" class="me-1" />
      <span>{{ t('components.agentMcpToggler.button') }}</span>
      <VTooltip activator="parent" location="bottom">
        {{ t('components.agentMcpToggler.tooltip') }}
      </VTooltip>
    </VBtn>

    <VDialog v-model="dialog" max-width="720">
      <VCard>
        <VCardTitle class="d-flex align-center pt-4 px-6">
          <VIcon icon="tabler-robot" size="24" class="me-2" />
          {{ t('components.agentMcpToggler.title') }}
          <VSpacer />
          <IconBtn @click="dialog = false">
            <VIcon icon="tabler-x" size="20" />
          </IconBtn>
        </VCardTitle>

        <VCardText class="px-6">
          <p class="mb-5">{{ t('components.agentMcpToggler.intro') }}</p>

          <h6 class="text-h6 mb-1">{{ t('components.agentMcpToggler.hostedTitle') }}</h6>
          <p class="text-body-2 mb-2">{{ t('components.agentMcpToggler.hostedText') }}</p>
          <div class="snippet mb-5">
            <code>{{ HOSTED_URL }}</code>
            <IconBtn size="small" @click="copy(HOSTED_URL)">
              <VIcon icon="tabler-copy" size="18" />
            </IconBtn>
          </div>

          <h6 class="text-h6 mb-1">{{ t('components.agentMcpToggler.localTitle') }}</h6>
          <p class="text-body-2 mb-2">{{ t('components.agentMcpToggler.localText') }}</p>
          <div class="snippet mb-2">
            <code>{{ NPX_COMMAND }}</code>
            <IconBtn size="small" @click="copy(NPX_COMMAND)">
              <VIcon icon="tabler-copy" size="18" />
            </IconBtn>
          </div>
          <div class="snippet mb-5">
            <code>{{ CLAUDE_COMMAND }}</code>
            <IconBtn size="small" @click="copy(CLAUDE_COMMAND)">
              <VIcon icon="tabler-copy" size="18" />
            </IconBtn>
          </div>

          <VAlert type="info" variant="tonal" density="compact" class="mb-2">
            {{ t('components.agentMcpToggler.keysNote') }}
          </VAlert>
        </VCardText>

        <VCardActions class="px-6 pb-4">
          <VBtn variant="text" :href="DOCS_URL" target="_blank" rel="noopener noreferrer">
            <VIcon icon="tabler-book" size="18" class="me-1" />
            {{ t('components.agentMcpToggler.docs') }}
          </VBtn>
          <VBtn variant="text" :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">
            <VIcon icon="tabler-brand-github" size="18" class="me-1" />
            GitHub
          </VBtn>
          <VBtn variant="text" :href="NPM_URL" target="_blank" rel="noopener noreferrer">
            <VIcon icon="tabler-brand-npm" size="18" class="me-1" />
            npm
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/composables/useSnackbar'

const HOSTED_URL = 'https://mcp.runonflux.com/mcp'
const NPX_COMMAND = 'npx -y @runonflux/flux-cloud-mcp'
const CLAUDE_COMMAND = 'claude mcp add flux-cloud -s user -- npx -y @runonflux/flux-cloud-mcp'
const DOCS_URL = 'https://docs.runonflux.com/fluxcloud/ai-agents-mcp'
const GITHUB_URL = 'https://github.com/RunOnFlux/flux-cloud-mcp'
const NPM_URL = 'https://www.npmjs.com/package/@runonflux/flux-cloud-mcp'

const { t } = useI18n()
const { showSnackbar } = useSnackbar()
const dialog = ref(false)

const copy = async text => {
  try {
    await navigator.clipboard.writeText(text)
    showSnackbar(t('components.agentMcpToggler.copied'), 'success')
  } catch {
    showSnackbar(t('components.agentMcpToggler.copyFailed'), 'error')
  }
}
</script>

<style scoped>
#agent-mcp-button {
  text-transform: none;
  letter-spacing: normal;
}

.snippet {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 12px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.snippet code {
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
  font-size: 0.85rem;
}

/* Make button fit icon only on smaller screens */
@media (max-width: 1279px) {
  #agent-mcp-button {
    min-width: auto !important;
    padding: 0 8px !important;
  }

  #agent-mcp-button span {
    display: none;
  }

  #agent-mcp-button .v-icon {
    margin-inline-end: 0 !important;
  }
}
</style>
