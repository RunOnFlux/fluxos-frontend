<template>
  <div class="why-flux-panel" :style="panelStyle">
    <FeatureShowcase
      :title="panelTitle"
      :subtitle="panelSubtitle"
      :items="panelItems"
      :padding="panelPadding"
      :background-color="panel.background"
      elevation="0"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FeatureShowcase from '@/components/FeatureShowcase.vue'

const props = defineProps({
  panel: {
    type: Object,
    required: true,
  },
  app: {
    type: Object,
    required: true,
  },
})

const { t, te } = useI18n()

// Helper function to check if a string is an i18n key
const isI18nKey = str => {
  return str && typeof str === 'string' && str.startsWith('i18n:')
}

// Resolve title
const panelTitle = computed(() => {
  if (!props.panel.title) return ''

  if (isI18nKey(props.panel.title)) {
    const key = props.panel.title.replace('i18n:', '')
    return te(key) ? t(key) : props.panel.title
  }

  return props.panel.title
})

// Resolve subtitle
const panelSubtitle = computed(() => {
  if (!props.panel.subtitle) return ''

  if (isI18nKey(props.panel.subtitle)) {
    const key = props.panel.subtitle.replace('i18n:', '')
    return te(key) ? t(key) : props.panel.subtitle
  }

  return props.panel.subtitle
})

// Pass items directly - FeatureShowcase will handle i18n keys
const panelItems = computed(() => {
  return props.panel.benefits || []
})

// Convert panel padding to string format
const panelPadding = computed(() => {
  if (props.panel.padding) {
    return `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
  }
  return '32px'
})

// Panel wrapper style
const panelStyle = computed(() => ({
  borderRadius: props.panel.cornerRadius ? `${props.panel.cornerRadius}px` : '0',
  marginBottom: '15px',
}))
</script>

<style scoped>
.why-flux-panel {
  margin-bottom: 8px;
}
</style>
