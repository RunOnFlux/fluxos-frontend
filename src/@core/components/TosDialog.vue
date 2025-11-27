<template>
  <VDialog v-model="isOpen" max-width="800" scrollable>
    <VCard id="tos-dialog" style="border-radius: 32px;">
      <VCardTitle class="d-flex align-center justify-space-between px-4 py-2 bg-primary">
        <div class="d-flex align-center gap-2">
          <VIcon icon="mdi-file-document-outline" size="28" color="white" />
          <span class="text-h5" style="color: white;">{{ title }}</span>
        </div>
        <VBtn
          icon="mdi-close"
          variant="text"
          size="small"
          color="white"
          @click="closeDialog"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="px-8 py-4 tos-scroll-area" style="max-height: calc(80vh - 200px); overflow-y: auto;">
        <LoadingSpinner
          v-if="isLoading"
          icon="mdi-file-document-outline"
          :title="t('core.tosDialog.loading')"
          rotate-icon
        />
        <div v-else class="tos-content" v-sanitize-html="tosContent"></div>
      </VCardText>

      <VCardActions class="pa-6 pt-4 justify-center">
        <VBtn
          color="success"
          variant="flat"
          size="default"
          min-width="120"
          prepend-icon="mdi-check-circle"
          @click="handleAgree"
        >
          {{ agreeText }}
        </VBtn>
        <VBtn
          color="error"
          variant="outlined"
          size="default"
          min-width="120"
          prepend-icon="mdi-close-circle"
          class="ml-4"
          @click="closeDialog"
        >
          {{ disagreeText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/Marketplace/LoadingSpinner.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Terms of Service',
  },
  agreeText: {
    type: String,
    default: 'I Agree',
  },
  disagreeText: {
    type: String,
    default: 'I Disagree',
  },
})
const emit = defineEmits(['update:modelValue', 'agree'])
const { t } = useI18n()
const i18n = useI18n()

const tosContent = ref('')
const isLoading = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Load TOS HTML content when dialog opens
const loadTOS = async () => {
  if (tosContent.value) return // Already loaded

  isLoading.value = true
  try {
    // Get current locale, default to 'en' if not found
    const locale = (i18n.locale?.value || i18n.global?.locale?.value || 'en')

    let html = ''
    try {
      // Try to import locale-specific HTML file
      const tosModule = await import(`../../html/tos/tos.${locale}.html?raw`)
      html = tosModule.default
    } catch (error) {
      // Fallback to English if locale file doesn't exist
      const tosModule = await import('../../html/tos/tos.en.html?raw')
      html = tosModule.default
    }

    // Replace all black color variations with inherited color for theme compatibility
    html = html.replace(/color:\s*black/gi, 'color: inherit')
    html = html.replace(/color:\s*#000000/gi, 'color: inherit')
    html = html.replace(/color:\s*rgb\(0,\s*0,\s*0\)/gi, 'color: inherit')

    tosContent.value = html
  } catch (error) {
    console.error('[TOS] Failed to load TOS:', error)
    tosContent.value = `<p>Failed to load Terms of Service. Please visit <a href="https://cdn.runonflux.io/Flux_Terms_of_Service.pdf" target="_blank">https://cdn.runonflux.io/Flux_Terms_of_Service.pdf</a></p>`
  } finally {
    isLoading.value = false
  }
}

// Watch dialog open state and load TOS when it opens
watch(() => props.modelValue, newValue => {
  if (newValue) {
    loadTOS()
  }
})

const closeDialog = () => {
  isOpen.value = false
}

const handleAgree = () => {
  emit('agree')
  closeDialog()
}
</script>

<style scoped>
.tos-scroll-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.3) transparent;
}

.tos-scroll-area::-webkit-scrollbar {
  width: 8px;
}

.tos-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.tos-scroll-area::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 4px;
}

.tos-scroll-area::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.5);
}

.tos-content {
  line-height: 1.6;
}

.tos-content h1,
.tos-content h2,
.tos-content h3 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.tos-content p {
  margin-bottom: 1em;
}

.tos-content ul,
.tos-content ol {
  margin-bottom: 1em;
  padding-left: 2em;
}
</style>
