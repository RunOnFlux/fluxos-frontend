<template>
  <div class="features-panel" :style="panelStyle">
    <VCard class="features-card" elevation="0">
      <VCardText>
        <h2 v-if="titleText" class="features-title">{{ titleText }}</h2>
        <p v-if="subtitleText" class="features-subtitle">{{ subtitleText }}</p>

        <div class="features-grid">
          <div
            v-for="(feature, index) in featuresList"
            :key="index"
            class="feature-item"
          >
            <div class="feature-icon-wrapper">
              <VIcon :icon="feature.icon || 'mdi-star'" size="40" :color="feature.color || 'primary'" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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

const i18n = useI18n()
const { t, te, tm } = i18n

// Helper function to check if a string is an i18n key
const isI18nKey = str => {
  return str && typeof str === 'string' && str.startsWith('i18n:')
}

// Get translated or raw title
const titleText = computed(() => {
  if (!props.panel.title) return ''

  if (isI18nKey(props.panel.title)) {
    const key = props.panel.title.replace('i18n:', '')
    
    return te(key) ? t(key) : props.panel.title
  }

  return props.panel.title
})

// Get translated or raw subtitle
const subtitleText = computed(() => {
  if (!props.panel.subtitle) return ''

  if (isI18nKey(props.panel.subtitle)) {
    const key = props.panel.subtitle.replace('i18n:', '')
    
    return te(key) ? t(key) : props.panel.subtitle
  }

  return props.panel.subtitle
})

// Get translated or raw features
const featuresList = computed(() => {
  if (!props.panel.features) return []

  if (isI18nKey(props.panel.features)) {
    const key = props.panel.features.replace('i18n:', '')

    // Try direct access via locale messages
    let features = null
    try {
      const locale = i18n.locale.value
      const parts = key.split('.')
      let value = i18n.messages.value[locale]

      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part]
        } else {
          break
        }
      }

      features = value
    } catch (e) {
      // Silently handle error
    }

    // Convert to array and unwrap proxy objects
    if (features && typeof features === 'object') {
      let featuresArray = Array.isArray(features) ? features : Object.values(features)

      // Deep clone to unwrap all proxies
      featuresArray = JSON.parse(JSON.stringify(featuresArray))

      // Extract actual string values from compiled i18n message objects
      featuresArray = featuresArray.map(feature => {
        const extractString = obj => {
          if (typeof obj === 'string') return obj
          if (obj && typeof obj === 'object') {
            return obj.body?.static || obj.loc?.source || obj.static || JSON.stringify(obj)
          }
          
          return String(obj)
        }

        return {
          icon: extractString(feature.icon),
          title: extractString(feature.title),
          description: extractString(feature.description),
          color: extractString(feature.color),
        }
      })

      return featuresArray
    }

    return []
  }

  return props.panel.features
})

const panelStyle = computed(() => ({
  padding: props.panel.padding
    ? `${props.panel.padding.top}px ${props.panel.padding.right}px ${props.panel.padding.bottom}px ${props.panel.padding.left}px`
    : '8px 24px',
  background: props.panel.background || 'transparent',
  borderRadius: props.panel.cornerRadius ? `${props.panel.cornerRadius}px` : '0',
  marginBottom: '15px',
}))
</script>

<style scoped>
.features-panel {
  margin-bottom: 8px;
}

.features-card {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(10px);
}

.features-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.features-subtitle {
  font-size: 1.125rem;
  text-align: center;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 24px;
  background: rgba(var(--v-theme-surface), 0.8);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.feature-icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
  border-radius: 50%;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.feature-item:hover .feature-icon-wrapper {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.2) 0%, rgba(var(--v-theme-secondary), 0.1) 100%);
  transform: scale(1.1);
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.feature-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .features-title {
    font-size: 1.75rem;
  }

  .features-subtitle {
    font-size: 1rem;
    margin-bottom: 32px;
  }

  .feature-item {
    padding: 24px 20px;
  }
}

@media (max-width: 600px) {
  .features-panel {
    padding: 8px 16px !important;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .features-title {
    font-size: 1.5rem;
  }

  .features-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }

  .feature-item {
    padding: 20px 16px;
  }

  .feature-icon-wrapper {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }

  .feature-icon-wrapper :deep(.v-icon) {
    font-size: 32px !important;
  }

  .feature-title {
    font-size: 1.125rem;
  }

  .feature-description {
    font-size: 0.875rem;
  }
}
</style>
